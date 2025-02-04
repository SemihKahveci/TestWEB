require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = process.env.PORT || 5000;

// Oyun verilerini saklamak için dizi
let gameData = [];

// Middleware'ler
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Statik dosyalar (Frontend için)
app.use(express.static(path.join(__dirname, "backend")));

// WebSocket bağlantıları
wss.on("connection", (ws) => {
    console.log("Yeni istemci bağlandı!");

    // Yeni istemci bağlandığında yalnızca gerekli verileri gönder
    const filteredData = gameData.map(entry => ({
        playerName: entry.playerName,
        answers: entry.answers.map(answer => ({
            questionNumber: answer.questionNumber,
            answerValue1: answer.answerValue1,
            answerValue2: answer.answerValue2
        })),
        date: entry.date
    }));

    ws.send(JSON.stringify(filteredData));

    ws.on("close", () => {
        console.log("Bir istemci bağlantıyı kapattı.");
    });
});

// Sonuçları almak için GET endpoint
app.get("/results", (req, res) => {
    // Yalnızca gerekli verileri gönder
    const filteredData = gameData.map(entry => ({
        playerName: entry.playerName,
        answers: entry.answers.map(answer => ({
            questionNumber: answer.questionNumber,
            answerValue1: answer.answerValue1,
            answerValue2: answer.answerValue2
        })),
        date: entry.date
    }));

    res.status(200).json(filteredData);
});

// Frontend'e ana sayfayı sun
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Unity'den gelen veriyi işleyen POST endpoint
app.post("/register", async (req, res) => {
    const { playerName } = req.body;
    let playerAnswers = [];

    // Tüm soru ve cevapları al
    for (let key in req.body) {
        if (key.startsWith("question")) {
            const questionNumber = key.match(/\d+/)[0]; // Sorunun numarasını al
            if (key.endsWith("_answerType")) {
                const answerType = req.body[key]; // Cevap tipi
                const answerValue1 = req.body[`question${questionNumber}_answerValue1`];
                const answerValue2 = req.body[`question${questionNumber}_answerValue2`];

                // Verileri sakla
                playerAnswers.push({
                    questionNumber: questionNumber,
                    answerType: answerType,
                    answerValue1: answerValue1,
                    answerValue2: answerValue2
                });
            }
        }
    }

    // Yeni veriyi ekle
    const newEntry = {
        playerName: playerName,
        answers: playerAnswers,
        date: new Date()
    };

    gameData.push(newEntry);

    // WebSocket istemcilerine yalnızca gerekli verileri gönder
    const filteredData = gameData.map(entry => ({
        playerName: entry.playerName,
        answers: entry.answers.map(answer => ({
            questionNumber: answer.questionNumber,
            answerValue1: answer.answerValue1,
            answerValue2: answer.answerValue2
        })),
        date: entry.date
    }));

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(filteredData));
        }
    });

    // JSON cevabı dön
    res.status(200).json({
        msg: "Register operation completed successfully.",
        playerName: playerName,
        answers: playerAnswers
    });

    console.log("Yeni veri alındı ve istemcilere gönderildi.");
});

// Sunucuyu başlat
server.listen(port, () => console.log(`Server is running on port ${port}`));
