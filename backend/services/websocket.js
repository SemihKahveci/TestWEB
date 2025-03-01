const WebSocket = require('ws');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        console.log('WebSocket servisi başlatıldı');
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Yeni istemci bağlandı!');

            ws.on('error', (error) => {
                console.error('WebSocket bağlantı hatası:', error);
            });

            ws.on('close', () => {
                console.log('Bir istemci bağlantıyı kapattı.');
            });
        });
    }

    async formatGameData(gameData) {
        try {
            return gameData.map(entry => ({
                playerName: entry.playerName,
                answer1: entry.answers[0]?.answerType1 || '-',
                answer2: entry.answers[1]?.answerType1 || '-',
                answer3: entry.answers[2]?.answerType1 || '-',
                answer4: entry.answers[3]?.answerType1 || '-',
                date: entry.date
            }));
        } catch (error) {
            console.error('Veri formatlanırken hata:', error);
            return [];
        }
    }

    async broadcastUpdate(gameData) {
        try {
            console.log('Gelen oyun verisi:', gameData);
            const formattedData = await this.formatGameData(gameData);
            console.log('Formatlanmış veri:', formattedData);

            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    try {
                        client.send(JSON.stringify(formattedData));
                        console.log('Veri başarıyla gönderildi');
                    } catch (error) {
                        console.error('Veri gönderilirken hata:', error);
                    }
                }
            });
        } catch (error) {
            console.error('Broadcast sırasında hata:', error);
        }
    }
}

module.exports = WebSocketService; 