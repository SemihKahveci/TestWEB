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

    // Sunucu durumu kontrolü
    async checkServerStatus(req, res) {
        res.json({ status: 'online' });
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