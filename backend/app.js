require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const WebSocketService = require('./services/websocketService');
const { safeLog } = require('./utils/helpers');
const { connectDB, disconnectDB } = require('./config/database');
const evaluationController = require('./controllers/evaluationController');
const adminRoutes = require('./routes/adminRoutes');
const gameManagementRoutes = require('./routes/gameManagementRoutes');
const codeController = require('./controllers/codeController');
const adminController = require('./controllers/adminController');
const companyManagementRoutes = require('./routes/companyManagementRoutes');
const competencyRoutes = require('./routes/competencyRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const groupRoutes = require('./routes/groupRoutes');
const authorizationRoutes = require('./routes/authorizationRoutes');
const cookieParser = require("cookie-parser");
const authRoutes = require('./routes/authRoutes');

const app = express();

const port = process.env.PORT || 5000;
app.disable('x-powered-by');

// MongoDB bağlantısını başlat
connectDB();

// Graceful shutdown
process.on('SIGINT', async () => {
    safeLog('debug', 'Uygulama kapatılıyor...');
    await disconnectDB();
    process.exit(0);
});

// Middleware
const allowedOrigins = [
    "https://androngame.com",
    "https://www.androngame.com",
    "http://localhost:3000", // Dev için
    "http://localhost:5173"
];
// Cookie Parser
app.use(cookieParser());

// CORS yapılandırması
const corsOptions = {
    origin: function (origin, callback) {
        // Origin yoksa (Postman / curl) izin ver
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        safeLog('warn', "⛔ Engellenen CORS isteği:", origin);
        return callback(new Error("CORS Engellendi: " + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// Preflight request'leri handle et - aynı CORS ayarlarını kullan
app.options("*", cors(corsOptions));

app.use(cors(corsOptions));



app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Public klasörünü root'tan serve et
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);

// HTTP sunucusu
const server = app.listen(port, () => {
    safeLog('debug', `Server ${port} portunda çalışıyor`);
});

// WebSocket servisi
const wsService = new WebSocketService(server);

// Otomatik kod geçerlilik kontrolü - Her saat başı çalışır
setInterval(async () => {
    try {
        await wsService.getCodeController().checkExpiredCodes();
    } catch (error) {
        safeLog('error', 'Otomatik kod kontrolü hatası', error);
    }
}, 60 * 60 * 1000); // Her saat (60 dakika * 60 saniye * 1000 milisaniye)

// İlk kontrolü hemen yap
setTimeout(async () => {
    try {
        await wsService.getCodeController().checkExpiredCodes();
    } catch (error) {
        console.error('İlk kod kontrolü hatası:', error);
    }
}, 5000); // 5 saniye sonra ilk kontrolü yap

// API Routes
const apiRouter = express.Router();

// WebSocket durumu
apiRouter.get('/ws-status', (req, res) => {
    res.json({
        isConnected: wsService.isConnected(),
        connectionCount: wsService.getConnectionCount()
    });
});

// MongoDB sağlık kontrolü
apiRouter.get('/health', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        // Basit bir ping testi
        await mongoose.connection.db.admin().ping();
        
        res.json({
            status: 'healthy',
            mongodb: {
                state: states[dbState],
                readyState: dbState,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            mongodb: {
                state: 'error',
                readyState: mongoose.connection.readyState,
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Kod işlemleri
apiRouter.post('/generate-code', wsService.getCodeController().generateCode.bind(wsService.getCodeController()));
apiRouter.get('/active-codes', wsService.getCodeController().listCodes.bind(wsService.getCodeController()));
apiRouter.post('/verify-code', wsService.getCodeController().verifyGameCode.bind(wsService.getCodeController()));
apiRouter.delete('/delete-code', wsService.getCodeController().deleteCode.bind(wsService.getCodeController()));
apiRouter.delete('/delete-all-codes', wsService.getCodeController().deleteAllCodes.bind(wsService.getCodeController()));
apiRouter.post('/send-code', adminController.sendCode.bind(adminController));
apiRouter.post('/update-code-status', adminController.updateCodeStatus.bind(adminController));
apiRouter.get('/user-results', adminController.getUserResults.bind(adminController));
apiRouter.post('/update-result-status', adminController.updateResultStatus.bind(adminController));
apiRouter.delete('/delete-result', adminController.deleteResult.bind(adminController));



// Oyun sonuçları
apiRouter.post('/register-result', wsService.getGameController().registerGameResult.bind(wsService.getGameController()));
apiRouter.get('/results', wsService.getGameController().getResults.bind(wsService.getGameController()));
apiRouter.delete('/results', wsService.getGameController().deleteAllResults.bind(wsService.getGameController()));
apiRouter.get('/check-status', wsService.getGameController().checkServerStatus.bind(wsService.getGameController()));

// Değerlendirme işlemleri
apiRouter.get('/evaluation/results', evaluationController.getAllEvaluations);
apiRouter.get('/evaluation/:id', evaluationController.getEvaluationById);
apiRouter.post('/evaluation/generatePDF', evaluationController.generatePDF);
apiRouter.post('/evaluation/generateWord', evaluationController.generateWord);

// PDF işlemleri
apiRouter.get('/preview-pdf', evaluationController.previewPDF);

// Admin işlemleri
apiRouter.use('/admin', adminRoutes);

// Auth işlemleri (şifremi unuttum)
apiRouter.post('/auth/forgot-password', adminController.forgotPassword.bind(adminController));
apiRouter.post('/auth/verify-reset-code', adminController.verifyResetCode.bind(adminController));
apiRouter.post('/auth/reset-password', adminController.resetPassword.bind(adminController));

// Game Management işlemleri
apiRouter.use('/game-management', gameManagementRoutes);

// Company Management işlemleri
apiRouter.use('/company-management', companyManagementRoutes);

// Competency işlemleri
apiRouter.use('/competency', competencyRoutes);

// Organization işlemleri
apiRouter.use('/organization', organizationRoutes);

// Group işlemleri
apiRouter.use('/group', groupRoutes);

// Authorization işlemleri
apiRouter.use('/authorization', authorizationRoutes);

// Credit işlemleri
const creditRoutes = require('./routes/creditRoutes');
apiRouter.use('/credit', creditRoutes);

// API route'larını uygula
app.use('/api', apiRouter);

app.get('/login', (req, res, next) => {
    res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    next();
});


// Admin paneli route'u - Production'da
if (process.env.NODE_ENV === 'production') {
    // Production'da root path'inde frontend build dosyalarını serve et
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    // Admin paneli için tüm route'ları frontend'e yönlendir (API ve /home route'ları hariç)
    app.get('*', (req, res, next) => {
        // API route'larını atla
        if (req.path.startsWith('/api')) {
            return next();
        }
        // /home route'unu atla (Next.js'e gidecek - nginx'te yönlendirilecek)
        if (req.path.startsWith('/home')) {
            return next();
        }
        // Diğer tüm route'ları frontend'e yönlendir
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
} else {
    // Development'da root path'ini React dev server'a proxy et
    app.get('/', (req, res) => {
        res.redirect('http://localhost:5173');
    });
    app.get('*', (req, res, next) => {
        // API route'larını atla
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.redirect(`http://localhost:5173${req.path}`);
    });
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Hata yönetimi
app.use((err, req, res, next) => {
    const { safeLog, getSafeErrorMessage } = require('./utils/helpers');
    safeLog('error', 'Global error handler', err);
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
        message: 'Bir hata oluştu',
        ...(isProduction ? {} : { error: err.message, stack: err.stack })
    });
});

