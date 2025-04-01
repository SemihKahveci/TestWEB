const WebSocket = require('ws');
const GameController = require('../controllers/gameController');
const CodeController = require('../controllers/codeController');
const WebSocketManager = require('./websocket');

class WebSocketService {
    constructor(server) {
        // WebSocket sunucusunu oluştur
        this.wss = new WebSocket.Server({ server });
        
        // WebSocket yöneticisini başlat
        this.wsManager = new WebSocketManager();
        
        // Controller'ları başlat
        this.gameController = new GameController(this.wss);
        this.codeController = new CodeController();
        
        // WebSocket olaylarını dinle
        this.initialize();
    }

    initialize() {
        this.wss.on('connection', (ws) => {
            console.log('Yeni WebSocket bağlantısı');
            this.wsManager.addConnection(ws);
            
            ws.on('message', (message) => {
                console.log('WebSocket mesajı alındı:', message);
            });
            
            ws.on('close', () => {
                console.log('WebSocket bağlantısı kapandı');
                this.wsManager.removeConnection(ws);
            });
        });
    }

    getGameController() {
        return this.gameController;
    }

    getCodeController() {
        return this.codeController;
    }

    // WebSocket durumunu kontrol etmek için metodlar
    isConnected() {
        return this.wsManager.isConnected();
    }

    getConnectionCount() {
        return this.wsManager.getConnectionCount();
    }
}

module.exports = WebSocketService; 