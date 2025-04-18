require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const WebSocketService = require('./services/websocketService');
const evaluationController = require('./controllers/evaluationController');
const adminRoutes = require('./routes/adminRoutes');
const codeController = require('./controllers/codeController');
const adminController = require('./controllers/adminController');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI + '/adminPanel', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB bağlantısı başarılı');
}).catch((err) => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1); // Bağlantı başarısız olursa uygulamayı sonlandır
});

// HTTP sunucusu
const server = app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
});

// WebSocket servisi
const wsService = new WebSocketService(server);

// API Routes
const apiRouter = express.Router();

// WebSocket durumu
apiRouter.get('/ws-status', (req, res) => {
    res.json({
        isConnected: wsService.isConnected(),
        connectionCount: wsService.getConnectionCount()
    });
});

// Kod işlemleri
apiRouter.post('/generate-code', wsService.getCodeController().generateCode.bind(wsService.getCodeController()));
apiRouter.get('/active-codes', wsService.getCodeController().listCodes.bind(wsService.getCodeController()));
apiRouter.post('/verify-code', wsService.getCodeController().verifyGameCode.bind(wsService.getCodeController()));
apiRouter.delete('/delete-code', wsService.getCodeController().deleteCode.bind(wsService.getCodeController()));
apiRouter.delete('/delete-all-codes', wsService.getCodeController().deleteAllCodes.bind(wsService.getCodeController()));
apiRouter.post('/send-code', adminController.sendCode.bind(adminController));

// Oyun sonuçları
apiRouter.post('/register-result', wsService.getGameController().registerGameResult.bind(wsService.getGameController()));
apiRouter.get('/results', wsService.getGameController().getResults.bind(wsService.getGameController()));
apiRouter.delete('/results', wsService.getGameController().deleteAllResults.bind(wsService.getGameController()));
apiRouter.get('/check-status', wsService.getGameController().checkServerStatus.bind(wsService.getGameController()));

// Değerlendirme işlemleri
apiRouter.get('/evaluation/:id', evaluationController.getEvaluationById);
apiRouter.post('/evaluation/:id/pdf', evaluationController.generatePDF);

// Admin işlemleri
apiRouter.use('/admin', adminRoutes);

// API route'larını uygula
app.use('/api', apiRouter);

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Hata yönetimi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Bir hata oluştu' });
});

