const WebSocket = require('ws');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.gameData = [];
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Yeni istemci bağlandı!');
            this.sendFilteredData(ws);

            ws.on('close', () => {
                console.log('Bir istemci bağlantıyı kapattı.');
            });
        });
    }

    filterGameData(data) {
        return data.map(entry => ({
            playerName: entry.playerName,
            answers: entry.answers.map(answer => ({
                questionNumber: answer.questionNumber,
                answerValue1: answer.answerValue1,
                answerValue2: answer.answerValue2,
                total: answer.total
            })),
            date: entry.date,
            totalScore: entry.totalScore
        }));
    }

    sendFilteredData(ws) {
        const filteredData = this.filterGameData(this.gameData);
        ws.send(JSON.stringify(filteredData));
    }

    broadcastUpdate(gameData) {
        this.gameData = gameData;
        const filteredData = this.filterGameData(gameData);
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(filteredData));
            }
        });
    }
}

module.exports = WebSocketService; 