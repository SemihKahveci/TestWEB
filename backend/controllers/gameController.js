const { answerMultipliers } = require('../config/constants');

class GameController {
    constructor(webSocketService) {
        this.gameData = [];
        this.webSocketService = webSocketService;
    }

    getResults(req, res) {
        const filteredData = this.gameData.map(entry => ({
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

        res.status(200).json(filteredData);
    }

    registerGame(req, res) {
        const { playerName } = req.body;
        let playerAnswers = [];
        let totalScore = 0;

        const questionsMap = {};

        for (let key in req.body) {
            if (key.startsWith('question')) {
                const questionNumber = key.match(/\d+/)[0];

                if (!questionsMap[questionNumber]) {
                    const answerType1 = req.body[`question${questionNumber}_answerType1`];
                    const answerType2 = req.body[`question${questionNumber}_answerType2`];
                    const answerValue1 = req.body[`question${questionNumber}_answerValue1`];
                    const answerValue2 = req.body[`question${questionNumber}_answerValue2`];

                    const multiplier1 = answerMultipliers[answerType1] || 0;
                    const multiplier2 = answerMultipliers[answerType2] || 0;

                    const questionScore = ((multiplier1 + (multiplier2 / 2)) * 2) / 3;

                    playerAnswers.push({
                        questionNumber,
                        answerType1,
                        answerType2,
                        answerValue1,
                        answerValue2,
                        total: questionScore
                    });

                    totalScore += questionScore;
                    questionsMap[questionNumber] = true;
                }
            }
        }

        const averageScore = totalScore / playerAnswers.length;

        const newEntry = {
            playerName: playerName,
            answers: playerAnswers,
            date: new Date(),
            totalScore: averageScore
        };

        this.gameData.push(newEntry);
        this.webSocketService.broadcastUpdate(this.gameData);

        res.status(200).json({
            msg: 'Register operation completed successfully.',
            playerName: playerName,
            answers: playerAnswers,
            totalScore: averageScore
        });

        console.log('Yeni veri alındı ve istemcilere gönderildi.');
    }
}

module.exports = GameController; 