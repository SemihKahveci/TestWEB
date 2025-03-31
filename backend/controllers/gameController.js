const { answerMultipliers } = require('../config/constants');
const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');
const Section = require('../models/section');

class GameController {
    constructor(wss) {
        this.wss = wss;
        this.clients = new Set();
        this.errorMessages = {
            invalidCode: 'Geçersiz veya kullanılmış kod',
            codeRequired: 'Kod gerekli',
            invalidData: 'Geçersiz veri formatı',
            serverError: 'Sunucu hatası',
            gameNotFound: 'Oyun bulunamadı',
            gameCompleted: 'Oyun zaten tamamlanmış',
            gameExpired: 'Oyun süresi dolmuş',
            noAnswers: 'Cevap verisi bulunamadı'
        };
    }

    // Kod doğrulama ve bölümleri getir
    async verifyGameCode(req, res) {
        try {
            const { code } = req.body;
            console.log('Gelen kod:', code);

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.codeRequired
                });
            }

            const userCode = await UserCode.findOne({ code, isUsed: false });
            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            // Kodu kullanılmış olarak işaretle
            userCode.isUsed = true;
            await userCode.save();

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı',
                sections: [
                    { name: 'Bölüm 1' },
                    { name: 'Bölüm 2' },
                    { name: 'Bölüm 3' }
                ]
            });
        } catch (error) {
            console.error('Kod doğrulama hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    // Sonuçları getir
    async getResults(req, res) {
        try {
            const games = await Game.find().sort({ date: -1 });
            
            if (!games || games.length === 0) {
                return res.status(200).json([]);
            }

            const formattedData = games.map(game => ({
                playerCode: game.playerCode || '-',
                section: game.section || '-',
                totalScore: game.totalScore || 0,
                answers: game.answers.map(answer => ({
                    questionId: answer.questionId || '-',
                    planetName: answer.planetName || '-',
                    questionText: answer.questionText || '-',
                    selectedAnswer1: answer.selectedAnswer1 || '-',
                    selectedAnswer2: answer.selectedAnswer2 || '-',
                    answerType1: answer.answerType1 || '-',
                    answerType2: answer.answerType2 || '-',
                    answerSubCategory: answer.answerSubCategory || '-'
                })),
                date: game.date
            }));

            res.status(200).json(formattedData);
        } catch (error) {
            console.error('Sonuçlar alınırken hata:', error);
            res.status(500).json({ error: this.errorMessages.serverError });
        }
    }

    // Oyun sonucu kaydetme
    async registerGameResult(req, res) {
        try {
            const data = req.body;
            console.log('Gelen veri:', data);

            if (!data?.playerCode || !data?.section || !Array.isArray(data?.answers)) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidData,
                    receivedData: data
                });
            }

            const userCode = await UserCode.findOne({ code: data.playerCode });
            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            const processedAnswers = data.answers.map(answer => ({
                questionId: answer.questionId || '-',
                planetName: answer.planetName || '-',
                questionText: answer.questionText || '-',
                selectedAnswer1: answer.selectedAnswer1 || '-',
                selectedAnswer2: answer.selectedAnswer2 || '-',
                answerType1: answer.answerType1 || '-',
                answerType2: answer.answerType2 || '-',
                answerSubCategory: answer.answerSubCategory || '-'
            }));

            const totalScore = processedAnswers.reduce((acc, answer) => {
                const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
            }, 0) / processedAnswers.length;

            const newGame = new Game({
                playerCode: data.playerCode,
                section: data.section,
                answers: processedAnswers,
                totalScore,
                date: new Date()
            });

            await newGame.save();
            userCode.isUsed = true;
            await userCode.save();

            // WebSocket üzerinden güncelleme gönder
            this.broadcastUpdate(await Game.find().sort({ date: -1 }));

            res.status(200).json({
                success: true,
                message: "Oyun sonucu kaydedildi"
            });

        } catch (error) {
            console.error('Sonuç kaydetme hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    // Kod üretme
    async generateCode(req, res) {
        try {
            const code = Math.random().toString(36).substring(2, 15).toUpperCase();
            const newCode = new UserCode({
                code,
                isUsed: false,
                createdAt: new Date()
            });

            await newCode.save();

            res.status(200).json({
                success: true,
                code,
                message: 'Yeni kod oluşturuldu'
            });
        } catch (error) {
            console.error('Kod oluşturma hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    // Kodları listele
    async listCodes(req, res) {
        try {
            const codes = await UserCode.find({ isUsed: false })
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                codes,
                message: 'Kodlar başarıyla listelendi'
            });
        } catch (error) {
            console.error('Kodları listeleme hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    // Sunucu durumu kontrolü
    async checkServerStatus(req, res) {
        try {
            res.status(200).json({
                status: "1",
                message: "Sunucu aktif"
            });
        } catch (error) {
            console.error('Sunucu durumu kontrolünde hata:', error);
            res.status(500).json({
                status: "-1",
                message: this.errorMessages.serverError
            });
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
            this.broadcastUpdate(allGames);

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
            this.broadcastUpdate();
            res.json({ success: true, message: 'Tüm sonuçlar başarıyla silindi' });
        } catch (error) {
            console.error('Sonuçları silerken hata:', error);
            res.status(500).json({ success: false, message: 'Sonuçlar silinirken bir hata oluştu' });
        }
    }

    // WebSocket üzerinden güncelleme gönder
    broadcastUpdate(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }
}

module.exports = GameController; 