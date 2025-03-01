const { answerMultipliers } = require('../config/constants');
const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');

class GameController {
    constructor(webSocketService) {
        this.webSocketService = webSocketService;
    }

    // Kodu doğrula ve oyuna başlama izni ver
    async verifyGameCode(req, res) {
        try {
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Kod gerekli'
                });
            }

            const userCode = await UserCode.findOne({ code, isUsed: false });

            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz veya kullanılmış kod'
                });
            }

            // Kodu henüz kullanılmış olarak işaretleme
            // Oyun sonuçları geldiğinde işaretlenecek
            
            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı, oyun başlayabilir'
            });
        } catch (error) {
            console.error('Kod doğrulama hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kod doğrulanırken bir hata oluştu'
            });
        }
    }

    async getResults(req, res) {
        try {
            const games = await Game.find().sort({ date: -1 });
            const formattedData = await Promise.all(games.map(async entry => {
                // Her oyun için cevap detaylarını düzenle
                const answers = {
                    answer1: '-',
                    answer2: '-',
                    answer3: '-',
                    answer4: '-'
                };

                // Cevapları yerleştir
                for (let i = 0; i < entry.answers.length && i < 4; i++) {
                    const answer = entry.answers[i];
                    // Cevap tiplerinin açıklamalarını al
                    const type1Description = await this.getAnswerDescription(answer.answerType1);
                    const type2Description = await this.getAnswerDescription(answer.answerType2);
                    
                    answers[`answer${i + 1}`] = `${type1Description} - ${type2Description}`;
                }

                return {
                    playerName: entry.playerName,
                    ...answers,
                    date: entry.date,
                    totalScore: entry.totalScore
                };
            }));

            res.status(200).json(formattedData);
        } catch (error) {
            console.error('Sonuçlar alınırken hata oluştu:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async registerGame(req, res) {
        try {
            const { playerName, code } = req.body;

            // Kodu bul ve kullanılmış olarak işaretle
            const userCode = await UserCode.findOne({ code, isUsed: false });
            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz veya kullanılmış kod'
                });
            }

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

            const newGame = new Game({
                playerName: playerName,
                answers: playerAnswers,
                totalScore: averageScore
            });

            await newGame.save();

            // Kodu kullanılmış olarak işaretle
            userCode.isUsed = true;
            await userCode.save();

            // WebSocket üzerinden tüm oyunları gönder
            const allGames = await Game.find().sort({ date: -1 });
            this.webSocketService.broadcastUpdate(allGames);

            res.status(200).json({
                success: true,
                message: 'Oyun kaydedildi',
                playerName: playerName,
                answers: playerAnswers,
                totalScore: averageScore
            });

            console.log('Yeni veri kaydedildi ve istemcilere gönderildi.');
        } catch (error) {
            console.error('Oyun kaydedilirken hata oluştu:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // Cevap tiplerini ekle
    async addAnswerTypes(req, res) {
        try {
            // Önce mevcut tipleri temizle
            await AnswerType.deleteMany({});

            const answerTypes = [
                {
                    type: 'AKY',
                    description: 'Belirsizlikle karşılaştığında enerjisi artar.'
                },
                {
                    type: 'CY',
                    description: 'Belirsizlik halinde bile soğukkanlılığını korur ve ilerleme sağlar.'
                },
                {
                    type: 'Y',
                    description: 'Belirsizlik durumunda yeni çözümler üretir.'
                }
            ];

            await AnswerType.insertMany(answerTypes);

            res.status(200).json({
                success: true,
                message: 'Cevap tipleri eklendi',
                types: answerTypes
            });
        } catch (error) {
            console.error('Cevap tipleri eklenirken hata:', error);
            res.status(500).json({
                success: false,
                message: 'Cevap tipleri eklenirken hata oluştu'
            });
        }
    }

    // Test verilerini ekle
    async addTestData(req, res) {
        try {
            // Önce mevcut test verilerini temizle
            await Game.deleteMany({});

            const testData = [
                {
                    playerName: "Test Oyuncu 1",
                    answers: [
                        {
                            questionNumber: "1",
                            answerType1: "AKY",
                            answerType2: "CY",
                            answerValue1: "Belirsizlikle karşılaştığında enerjisi artar.",
                            answerValue2: "Belirsizlik halinde bile soğukkanlılığını korur ve ilerleme sağlar.",
                            total: 8.5
                        },
                        {
                            questionNumber: "2",
                            answerType1: "CY",
                            answerType2: "Y",
                            answerValue1: "Belirsizlik halinde bile soğukkanlılığını korur ve ilerleme sağlar.",
                            answerValue2: "Belirsizlik durumunda yeni çözümler üretir.",
                            total: 7.2
                        }
                    ],
                    totalScore: 7.85
                },
                {
                    playerName: "Test Oyuncu 2",
                    answers: [
                        {
                            questionNumber: "1",
                            answerType1: "Y",
                            answerType2: "AKY",
                            answerValue1: "Belirsizlik durumunda yeni çözümler üretir.",
                            answerValue2: "Belirsizlikle karşılaştığında enerjisi artar.",
                            total: 6.8
                        }
                    ],
                    totalScore: 6.8
                }
            ];

            // Verileri veritabanına kaydet
            for (const data of testData) {
                const newGame = new Game(data);
                await newGame.save();
            }

            // WebSocket üzerinden güncel verileri gönder
            const allGames = await Game.find().sort({ date: -1 });
            this.webSocketService.broadcastUpdate(allGames);

            res.status(200).json({
                success: true,
                message: 'Test verileri başarıyla eklendi',
                count: testData.length
            });

        } catch (error) {
            console.error('Test verileri eklenirken hata:', error);
            res.status(500).json({
                success: false,
                message: 'Test verileri eklenirken hata oluştu'
            });
        }
    }

    // Cevap tipine göre açıklamayı getir
    async getAnswerDescription(type) {
        const answerType = await AnswerType.findOne({ type });
        return answerType ? answerType.description : null;
    }

    // Tüm sonuçları sil
    async deleteAllResults(req, res) {
        try {
            await Game.deleteMany({});
            
            // WebSocket üzerinden boş liste gönder
            this.webSocketService.broadcastUpdate([]);

            res.status(200).json({
                success: true,
                message: 'Tüm sonuçlar başarıyla silindi'
            });
        } catch (error) {
            console.error('Sonuçlar silinirken hata oluştu:', error);
            res.status(500).json({
                success: false,
                message: 'Sonuçlar silinirken bir hata oluştu'
            });
        }
    }
}

module.exports = GameController; 