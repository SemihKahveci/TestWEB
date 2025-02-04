require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;

// Dummy game data
let gameData = [];

// Start the server
app.listen(port, console.log(`Server is running on the port ${port}`));

// Middlewares for parsing the body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files for the frontend
app.use(express.static(path.join(__dirname, 'backend')));

// Route for getting results
router.get('/results', (req, res, next) => {
    res.status(200).json(gameData);
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // 'index.html' dosyanızın yolu
});

// POST /register route to handle data from Unity
router.post('/register', async (req, res, next) => {
    const { playerName } = req.body;
    let playerAnswers = [];

    // Alınan sorular ve cevapları işliyoruz
    for (let key in req.body) {
        // "questionX_answerType" ve "questionX_answerValue" parametreleri
        if (key.startsWith('question')) {
            const questionNumber = key.match(/\d+/)[0]; // Sorunun numarasını almak
            if (key.endsWith('_answerType')) {
                const answerType = req.body[key];
                const answerValue = req.body[`question${questionNumber}_answerValue`];
                
                // Her bir cevabı playerAnswers dizisine ekliyoruz
                playerAnswers.push({
                    questionNumber: questionNumber,
                    answerValue: answerValue,
                    answerType: answerType
                });
            }
        }
    }

    // Veriyi gameData dizisine ekliyoruz
    gameData.push({
        playerName: playerName,
        answers: playerAnswers,
        date: new Date()
    });

    // Başarıyla işlenmiş yanıtı gönderiyoruz
    res.status(200).json({
        msg: 'Register operation completed successfully.',
        playerName: playerName,
        answers: playerAnswers
    });

    console.log("Mesaj geldi:", req.body);
});

// Attach the router
app.use('/', router);
