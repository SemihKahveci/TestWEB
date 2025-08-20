const WebSocket = require('ws');
const GameController = require('../controllers/gameController');
const CodeController = require('../controllers/codeController');

class WebSocketService {
    constructor(server) {
        // WebSocket sunucusunu oluştur
        this.wss = new WebSocket.Server({ server });
        
        // Bağlantıları takip et
        this.connections = new Map();
        
        // Controller'ları başlat
        this.gameController = new GameController(this.wss);
        this.codeController = new CodeController();
        
        // WebSocket olaylarını dinle
        this.initialize();
    }

    initialize() {
        this.wss.on('connection', (ws) => {
            this.addConnection(ws);
            
            ws.on('message', (message) => {
                // Mesaj işleme (gerekirse)
            });
            
            ws.on('close', () => {
                this.removeConnection(ws);
            });
        });
    }

    addConnection(ws) {
        this.connections.set(ws, {
            connectedAt: new Date(),
            isActive: true
        });
    }

    removeConnection(ws) {
        this.connections.delete(ws);
    }

    getGameController() {
        return this.gameController;
    }

    getCodeController() {
        return this.codeController;
    }

    // WebSocket durumunu kontrol etmek için metodlar
    isConnected() {
        return this.connections.size > 0;
    }

    getConnectionCount() {
        return this.connections.size;
    }

    // Tüm bağlantılara mesaj gönder
    broadcast(message) {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        this.connections.forEach((connection, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }
}

module.exports = WebSocketService; 