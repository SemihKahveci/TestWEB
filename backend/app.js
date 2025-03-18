require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const path = require('path');
const GameController = require('./controllers/gameController');
const WebSocketService = require('./services/websocket');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error('Hata:', err);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası: ' + err.message
    });
});

// MongoDB bağlantı ayarları
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
};

// WebSocket servisi
const wss = new WebSocket.Server({ port: process.env.WS_PORT || 5001 });
const webSocketService = new WebSocketService(wss);

// Game Controller
const gameController = new GameController(webSocketService);

// API Routes
app.post('/api/codes/generate', async (req, res) => {
    try {
        // MongoDB bağlantı durumunu kontrol et
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB bağlantısı aktif değil');
        }
        await gameController.generateCode(req, res);
    } catch (error) {
        console.error('Kod üretme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kod üretilirken bir hata oluştu: ' + error.message
        });
    }
});

app.get('/api/codes/list', async (req, res) => {
    try {
        // MongoDB bağlantı durumunu kontrol et
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB bağlantısı aktif değil');
        }
        await gameController.listCodes(req, res);
    } catch (error) {
        console.error('Kod listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kodlar listelenirken bir hata oluştu: ' + error.message
        });
    }
});

app.get('/api/results', gameController.getResults.bind(gameController));
app.delete('/api/results', gameController.deleteAllResults.bind(gameController));

// Yeni ICD endpoint'leri
app.get('/api/status', gameController.checkServerStatus.bind(gameController));
app.post('/api/verify-code', gameController.verifyCodeAndGetSections.bind(gameController));
app.post('/api/register-result', gameController.registerGameResult.bind(gameController));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB bağlantısı ve sunucu başlatma
const startServer = async () => {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
        console.log('MongoDB Atlas bağlantısı başarılı');

        // Bağlantı durumunu dinle
        mongoose.connection.on('error', err => {
            console.error('MongoDB bağlantı hatası:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB bağlantısı kesildi');
        });

        // MongoDB bağlantısı başarılı olduktan sonra sunucuyu başlat
        app.listen(port, () => {
            console.log(`Sunucu ${port} portunda çalışıyor`);
            console.log(`WebSocket sunucusu ${process.env.WS_PORT || 5001} portunda çalışıyor`);
        });
    } catch (err) {
        console.error('MongoDB bağlantı hatası:', err);
        process.exit(1);
    }
};

// Sunucuyu başlat
startServer();