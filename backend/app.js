// .env konfigürasyonu en başta olmalı
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const AnswerType = require('./models/answerType');

// Environment variables'ı kontrol et
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const { PORT } = require('./config/constants');
const connectDB = require('./config/database');
const WebSocketService = require('./services/websocket');
const GameController = require('./controllers/gameController');

// Cevap tiplerinin varlığını kontrol et ve yoksa ekle
async function ensureAnswerTypes() {
    try {
        const count = await AnswerType.countDocuments();
        if (count === 0) {
            const defaultTypes = [
                {
                    type: "AKY",
                    description: "Belirsizlikle karşılaştığında enerjisi artar."
                },
                {
                    type: "CY",
                    description: "Belirsizlik halinde bile soğukkanlılığını korur ve ilerleme sağlar."
                },
                {
                    type: "Y",
                    description: "Belirsizlik durumunda yeni çözümler üretir."
                }
            ];

            await AnswerType.insertMany(defaultTypes);
            console.log('Varsayılan cevap tipleri eklendi.');
        }
    } catch (error) {
        console.error('Cevap tipleri kontrol edilirken hata:', error);
    }
}

// MongoDB bağlantısı
connectDB().then(() => {
    ensureAnswerTypes();
});

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
app.use(express.static(path.join(__dirname, '..')));

// Route'lar
const gameRoutes = require('./routes/gameRoutes')(gameController);
const codeRoutes = require('./routes/codeRoutes');

app.use('/', gameRoutes);
app.use('/codes', codeRoutes);

// Frontend'e ana sayfayı sun
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Sunucuyu başlat
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));