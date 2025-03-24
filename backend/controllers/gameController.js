const { answerMultipliers } = require('../config/constants');
const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');
const Section = require('../models/section');

class GameController {
    constructor(webSocketService) {
        this.webSocketService = webSocketService;
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

    // Kod doğrulama yardımcı fonksiyonu
    async verifyCode(code) {
        if (!code) {
            return {
                success: false,
                message: this.errorMessages.codeRequired
            };
        }

        const userCode = await UserCode.findOne({ code, isUsed: false });
        if (!userCode) {
            return {
                success: false,
                message: this.errorMessages.invalidCode
            };
        }

        return {
            success: true,
            userCode: userCode
        };
    }

    // Kodu doğrula ve oyuna başlama izni ver
    async verifyGameCode(req, res) {
        try {
            const { code } = req.body;
            console.log('Gelen kod:', code);

            if (!code) {
                console.log('Kod boş geldi');
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.codeRequired
                });
            }

            const userCode = await UserCode.findOne({ code, isUsed: false });
            console.log('Veritabanında bulunan kod:', userCode);

            if (!userCode) {
                console.log('Kod bulunamadı veya kullanılmış');
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            // Kodu kullanılmış olarak işaretle
            userCode.isUsed = true;
            await userCode.save();
            console.log('Kod kullanılmış olarak işaretlendi');

            // Sabit bölümleri döndür
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

    async getResults(req, res) {
        try {
            console.log('Sonuçlar alınıyor...');
            const games = await Game.find().sort({ date: -1 });
            console.log('Veritabanından alınan oyunlar:', games);

            if (!games || games.length === 0) {
                console.log('Veritabanında oyun bulunamadı');
                return res.status(200).json([]);
            }

            const formattedData = games.map(game => {
                console.log('İşlenen oyun:', game);
                return {
                    playerCode: game.playerCode || '-',
                    section: game.section || '-',
                    totalScore: game.totalScore || 0,
                    answers: game.answers.map(answer => {
                        console.log('İşlenen cevap:', answer);
                        return {
                            questionId: answer.questionId || '-',
                            planetName: answer.planetName || '-',
                            questionText: answer.questionText || '-',
                            selectedAnswer1: answer.selectedAnswer1 || '-',
                            selectedAnswer2: answer.selectedAnswer2 || '-',
                            answerType1: answer.answerType1 || '-',
                            answerType2: answer.answerType2 || '-',
                            answerSubCategory: answer.answerSubCategory || '-'
                        };
                    }),
                    date: game.date
                };
            });

            console.log('Formatlanmış veri:', formattedData);
            res.status(200).json(formattedData);
        } catch (error) {
            console.error('Sonuçlar alınırken hata oluştu:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async registerGame(req, res) {
        try {
            const { playerName, code } = req.body;
            const verificationResult = await this.verifyCode(code);

            if (!verificationResult.success) {
                return res.status(400).json(verificationResult);
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
            verificationResult.userCode.isUsed = true;
            await verificationResult.userCode.save();

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
            res.status(500).json({ 
                success: false,
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

    // Sunucu durumu kontrolü
    async checkServerStatus(req, res) {
        try {
            // Burada sunucu durumunu kontrol edebiliriz
            // Örneğin: bakım modu, veritabanı bağlantısı vs.
            res.status(200).json({
                status: "1", // 1: Aktif, -1: Bakımda
                message: "Sunucu aktif"
            });
        } catch (error) {
            console.error('Sunucu durumu kontrolünde hata:', error);
            res.status(500).json({
                status: "-1",
                message: "Sunucu hatası"
            });
        }1
    }

    // Kodu doğrula ve bölümleri getir (eski fonksiyon - artık kullanılmıyor)
    async verifyCodeAndGetSections(req, res) {
        return this.verifyGameCode(req, res);
    }

    // Oyun sonucu kaydetme
    async registerGameResult(req, res) {
        try {
            const { data } = req.body;
            console.log('Gelen veri:', data);

            if (!data || !data.playerCode || !data.section || !data.answers || !Array.isArray(data.answers)) {
                console.log('Geçersiz veri formatı');
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidData
                });
            }

            const userCode = await UserCode.findOne({ code: data.playerCode });
            if (!userCode) {
                console.log('Kod bulunamadı');
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            // Cevapları işle
            const processedAnswers = data.answers.map(answer => {
                // Eksik alanları kontrol et ve varsayılan değerler ata
                return {
                    questionId: answer.questionId || '-',
                    planetName: answer.planetName || '-',
                    questionText: answer.questionText || '-',
                    selectedAnswer1: answer.selectedAnswer1 || '-',
                    selectedAnswer2: answer.selectedAnswer2 || '-',
                    answerType1: answer.answerType1 || '-',
                    answerType2: answer.answerType2 || '-',
                    answerSubCategory: answer.answerSubCategory || '-'
                };
            });

            // Toplam skoru hesapla
            let totalScore = 0;
            processedAnswers.forEach(answer => {
                const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                const questionScore = ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                totalScore += questionScore;
            });
            totalScore = totalScore / processedAnswers.length;

            console.log('İşlenmiş cevaplar:', processedAnswers);
            console.log('Hesaplanan toplam skor:', totalScore);

            // Yeni oyun kaydı oluştur
            const newGame = new Game({
                playerCode: data.playerCode,
                section: data.section,
                answers: processedAnswers,
                totalScore: totalScore,
                date: new Date()
            });

            await newGame.save();
            console.log('Yeni oyun kaydedildi:', newGame);

            // Kodu kullanılmış olarak işaretle
            userCode.isUsed = true;
            await userCode.save();

            // WebSocket üzerinden güncelleme gönder
            if (this.webSocketService) {
                const allGames = await Game.find().sort({ date: -1 });
                this.webSocketService.broadcastUpdate(allGames);
            }

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
                code: code,
                isUsed: false,
                createdAt: new Date()
            });

            await newCode.save();

            res.status(200).json({
                success: true,
                code: code,
                message: 'Yeni kod oluşturuldu'
            });
        } catch (error) {
            console.error('Kod oluşturma hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kod oluşturulurken bir hata oluştu'
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
                codes: codes,
                message: 'Kodlar başarıyla listelendi'
            });
        } catch (error) {
            console.error('Kodları listeleme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kodlar listelenirken bir hata oluştu'
            });
        }
    }
}

module.exports = GameController; 