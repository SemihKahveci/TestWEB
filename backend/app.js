require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app); // HTTP sunucusunu oluştur
const wss = new WebSocket.Server({ server }); // WebSocket sunucusunu başlat

const port = process.env.PORT || 5000;

// Dummy game data
let gameData = [];

// Middlewares for parsing the body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files for the frontend
app.use(express.static(path.join(__dirname, "backend")));

// WebSocket bağlantılarını yönetme
wss.on("connection", (ws) => {
    console.log("Yeni istemci bağlandı!");

    // Yeni istemci bağlandığında mevcut verileri gönder
    ws.send(JSON.stringify(gameData));

    ws.on("close", () => {
        console.log("Bir istemci bağlantıyı kapattı.");
    });
});

// Route for getting results
app.get("/results", (req, res) => {
    res.status(200).json(gameData);
});

// Serve the frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// POST /register route to handle data from Unity
app.post("/register", async (req, res) => {
    const { playerName } = req.body;
    let playerAnswers = [];

    // Alınan sorular ve cevapları işliyoruz
    for (let key in req.body) {
        if (key.startsWith("question")) {
            const questionNumber = key.match(/\d+/)[0]; // Sorunun numarasını almak
            if (key.endsWith("_answerType")) {
                const answerType = req.body[key];
                const answerValue1 = req.body[`question${questionNumber}_answerValue1`];
                const answerValue2 = req.body[`question${questionNumber}_answerValue2`];

                // Her bir cevabı playerAnswers dizisine ekliyoruz
                playerAnswers.push({
                    questionNumber: questionNumber,
                    answerValue1: answerValue1,
                    answerValue2: answerValue2
                });
            }
        }
    }

    // Yeni veriyi gameData dizisine ekliyoruz
    const newEntry = {
        playerName: playerName,
        answers: playerAnswers,
        date: new Date()
    };

    gameData.push(newEntry);

    // Yeni veriyi bağlı WebSocket istemcilerine gönder
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gameData));
        }
    });

    // Başarıyla işlenmiş yanıtı gönderiyoruz
    res.status(200).json({
        msg: "Register operation completed successfully.",
        playerName: playerName,
        answers: playerAnswers
    });

    console.log("Yeni veri alındı ve istemcilere gönderildi.");
});

// Start the server
server.listen(port, () => console.log(`Server is running on port ${port}`));
