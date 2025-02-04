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

// Cevap tiplerine göre çarpanlar
const answerMultipliers = {
    "AKY": 1,
    "CY": 0.75,
    "Y": 0.45,
    "AY": 0
};

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
            answerValue2: answer.answerValue2,
            total: answer.total // Hesaplanmış sonucu ekledik
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
            answerValue2: answer.answerValue2,
            total: answer.total // Hesaplanmış sonucu ekledik
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
    let totalScore = 0; // Hesaplanan toplam puan

    // Tüm soru ve cevapları al
    for (let key in req.body) {
        if (key.startsWith("question")) {
            const questionNumber = key.match(/\d+/)[0]; // Sorunun numarasını al
            if (key.endsWith("_answerType1") || key.endsWith("_answerType2")) {
                // İki farklı answerType'ı alıyoruz
                const answerType1 = req.body[`question${questionNumber}_answerType1`];
                const answerType2 = req.body[`question${questionNumber}_answerType2`];
                const answerValue1 = req.body[`question${questionNumber}_answerValue1`];  // string olarak alıyoruz
                const answerValue2 = req.body[`question${questionNumber}_answerValue2`];  // string olarak alıyoruz

                // Her iki answerType'ı çarpanlarla hesaba katacağız
                const multiplier1 = answerMultipliers[answerType1] || 0; // Varsayılan değer 0
                const multiplier2 = answerMultipliers[answerType2] || 0; // Varsayılan değer 0

                // Soruların puanlarını formüle göre hesapla (string değerler üzerinden işlem yapılacak)
                const questionScore = ((multiplier1 + (multiplier2 / 2)) * 2) / 3;

                // Verileri sakla
                playerAnswers.push({
                    questionNumber: questionNumber,
                    answerType1: answerType1,
                    answerType2: answerType2,
                    answerValue1: answerValue1, // String olarak sakla
                    answerValue2: answerValue2, // String olarak sakla
                    total: questionScore // Hesaplanmış sorunun puanı
                });

                // Toplam puarı biriktir
                totalScore += questionScore;
            }
        }
    }

    // Tüm soruların aritmetik ortalamasını al
    const averageScore = totalScore / playerAnswers.length;

    // Yeni veriyi ekle
    const newEntry = {
        playerName: playerName,
        answers: playerAnswers,
        date: new Date(),
        totalScore: averageScore // Ortalama puan
    };

    gameData.push(newEntry);

    // WebSocket istemcilerine yalnızca gerekli verileri gönder
    const filteredData = gameData.map(entry => ({
        playerName: entry.playerName,
        answers: entry.answers.map(answer => ({
            questionNumber: answer.questionNumber,
            answerValue1: answer.answerValue1, // String olarak gönder
            answerValue2: answer.answerValue2, // String olarak gönder
            total: answer.total // Hesaplanmış sonucu ekledik
        })),
        date: entry.date,
        totalScore: entry.totalScore // Toplam puanı ekledik
    }));

    // WebSocket istemcilerine gönder
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(filteredData));
        }
    });

    // JSON cevabı dön
    res.status(200).json({
        msg: "Register operation completed successfully.",
        playerName: playerName,
        answers: playerAnswers,
        totalScore: averageScore // Ortalama puanı da geri gönder
    });

    console.log("Yeni veri alındı ve istemcilere gönderildi.");
});

// Sunucuyu başlat
server.listen(port, () => console.log(`Server is running on port ${port}`));
