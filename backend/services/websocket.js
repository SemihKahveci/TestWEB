const WebSocket = require('ws');

class WebSocketManager {
    constructor() {
        this.connections = new Map();
        this.connected = false;
    }

    addConnection(ws) {
        this.connections.set(ws, true);
        this.connected = true;
    }

    removeConnection(ws) {
        this.connections.delete(ws);
        this.connected = this.connections.size > 0;
    }

    isConnected() {
        return this.connected;
    }

    getConnectionCount() {
        return this.connections.size;
    }
}

module.exports = WebSocketManager; 