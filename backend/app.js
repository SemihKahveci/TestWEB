require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const { PORT } = require('./config/constants');
const WebSocketService = require('./services/websocket');
const GameController = require('./controllers/gameController');

const app = express();
const server = http.createServer(app);

// WebSocket servisi başlatılıyor
const webSocketService = new WebSocketService(server);

// Oyun kontrolcüsü oluşturuluyor
const gameController = new GameController(webSocketService);

// Middleware'ler
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Statik dosyalar (Frontend için)
app.use(express.static(path.join(__dirname, 'backend')));

// Route'lar
const gameRoutes = require('./routes/gameRoutes')(gameController);
app.use('/', gameRoutes);

// Frontend'e ana sayfayı sun
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu başlat
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
