require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const WebSocket = require('ws');
const GameController = require('./controllers/gameController');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

// WebSocket sunucusu
const server = app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
});

const wss = new WebSocket.Server({ server });
const gameController = new GameController(wss);

// WebSocket bağlantı yönetimi
wss.on('connection', (ws) => {
    console.log('Yeni WebSocket bağlantısı');
    
    ws.on('close', () => {
        console.log('WebSocket bağlantısı kapandı');
    });
});

// API Routes
app.post('/api/generate-code', codeController.generateCode.bind(codeController));
app.get('/api/active-codes', codeController.listCodes.bind(codeController));
app.post('/api/verify-code', codeController.verifyCode.bind(codeController));
app.post('/api/register-result', gameController.registerGameResult.bind(gameController));
app.get('/api/results', gameController.getResults.bind(gameController));
app.delete('/api/results', gameController.deleteAllResults.bind(gameController));
app.get('/api/check-status', gameController.checkServerStatus.bind(gameController));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});