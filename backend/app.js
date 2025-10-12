require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const WebSocketService = require('./services/websocketService');
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

const app = express();
const port = process.env.PORT || 5000;

// MongoDB bağlantısı - Güncellenmiş ayarlar ve yeniden deneme mekanizması
const connectWithRetry = async (retryCount = 0, maxRetries = 5) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 saniye - daha uzun timeout
            socketTimeoutMS: 60000, // 60 saniye - daha uzun socket timeout
            connectTimeoutMS: 30000, // 30 saniye - daha uzun bağlantı timeout
            maxPoolSize: 20, // Daha fazla bağlantı havuzu
            minPoolSize: 5, // Daha fazla minimum bağlantı
            maxIdleTimeMS: 60000, // 60 saniye idle time
            retryWrites: true,
            retryReads: true,
            family: 4, // IPv4 kullan
            heartbeatFrequencyMS: 10000, // Daha sık heartbeat
            maxStalenessSeconds: 90, // Stale okuma toleransı
        });
        console.log('✅ MongoDB bağlantısı başarılı');
    } catch (err) {
        console.error(`❌ MongoDB bağlantı hatası (Deneme ${retryCount + 1}/${maxRetries}):`, err.message);
        
        if (retryCount < maxRetries - 1) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            console.log(`⏳ ${delay/1000} saniye sonra tekrar denenecek...`);
            setTimeout(() => connectWithRetry(retryCount + 1, maxRetries), delay);
        } else {
            console.error('💥 MongoDB bağlantısı kurulamadı, maksimum deneme sayısına ulaşıldı');
            process.exit(1);
        }
    }
};

// Bağlantıyı başlat
connectWithRetry();

// MongoDB bağlantı olaylarını dinle - Geliştirilmiş hata yönetimi
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB bağlantısı aktif');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB bağlantı hatası:', err);
    console.error('Hata detayları:', {
        name: err.name,
        message: err.message,
        code: err.code,
        codeName: err.codeName
    });
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB bağlantısı kesildi');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB bağlantısı yeniden kuruldu');
});

mongoose.connection.on('close', () => {
    console.log('🔒 MongoDB bağlantısı kapatıldı');
});

// Bağlantı durumu kontrolü
mongoose.connection.on('open', () => {
    console.log('🚀 MongoDB bağlantısı açık ve hazır');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Uygulama kapatılıyor...');
    await mongoose.connection.close();
    process.exit(0);
});

// Middleware
app.use(cors({
    origin: true, // Tüm origin'lere izin ver
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// HTTP sunucusu
const server = app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
});

// WebSocket servisi
const wsService = new WebSocketService(server);

// Otomatik kod geçerlilik kontrolü - Her saat başı çalışır
setInterval(async () => {
    try {
        await wsService.getCodeController().checkExpiredCodes();
    } catch (error) {
        console.error('Otomatik kod kontrolü hatası:', error);
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

// PDF işlemleri
apiRouter.get('/preview-pdf', evaluationController.previewPDF);

// Admin işlemleri
apiRouter.use('/admin', adminRoutes);

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

// API route'larını uygula
app.use('/api', apiRouter);

// Ana sayfa - Production'da frontend static dosyalarını serve et
if (process.env.NODE_ENV === 'production') {
    // Production'da frontend build dosyalarını serve et
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
} else {
    // Development'da React dev server'a yönlendir
    app.get('/', (req, res) => {
        res.redirect('http://localhost:5173');
    });
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Hata yönetimi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Bir hata oluştu' });
});

