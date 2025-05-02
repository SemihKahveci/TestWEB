const { answerMultipliers } = require('../config/constants');
const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');
const Section = require('../models/section');
const EvaluationController = require('./evaluationController');
const mongoose = require('mongoose');

class GameController {
    constructor(wss) {
        this.wss = wss;
        this.clients = new Set();
        this.errorMessages = {
            invalidCode: 'Geçersiz veya kullanılmış kod',
            invalidData: 'Geçersiz veri formatı',
            serverError: 'Sunucu hatası',
        };
    }

   
    // Sonuçları getir
    async getResults(req, res) {
        try {
            const games = await Game.find().sort({ date: -1 });
            
            if (!games || games.length === 0) {
                return res.status(200).json([]);
            }

            const formattedData = games.map(game => {
                return {
                    playerCode: game.playerCode || '-',
                    section: game.section || '-',
                    date: game.date,
                    dummyData: game.dummyData,
                    evaluationResult: game.evaluationResult,
                    // Results.html için gerekli alanlar
                    code: game.playerCode,
                    name: game.dummyData?.name || '-',
                    sentDate: game.sentDate,
                    completionDate: game.completionDate,
                    expiryDate: game.expiryDate,
                    status: game.status,
                    customerFocusScore: game.customerFocusScore || '-',
                    uncertaintyScore: game.uncertaintyScore || '-'
                };
            });

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

            // Skorları hesapla
            const customerFocusAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'MO'
            );
            const uncertaintyAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'BY'
            );

            // MO skorunu hesapla
            let customerFocusScore = 0;
            if (customerFocusAnswers.length > 0) {
                customerFocusScore = customerFocusAnswers.reduce((acc, answer) => {
                    const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                    const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                    return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                }, 0) / customerFocusAnswers.length;
            }

            // BY skorunu hesapla
            let uncertaintyScore = 0;
            if (uncertaintyAnswers.length > 0) {
                uncertaintyScore = uncertaintyAnswers.reduce((acc, answer) => {
                    const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                    const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                    return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                }, 0) / uncertaintyAnswers.length;
            }

            // Değerlendirme sonuçlarını getir
            const evaluationResult = await this.getReportsByAnswerType(data.answers);
            console.log('Değerlendirme sonucu:', evaluationResult);

            // UserCode durumunu güncelle
            await UserCode.findOneAndUpdate(
                { code: data.playerCode },
                { 
                    status: 'tamamlandı',
                    completionDate: new Date(),
                    evaluationResult: evaluationResult,
                    customerFocusScore: customerFocusScore.toFixed(2),
                    uncertaintyScore: uncertaintyScore.toFixed(2)
                }
            );

            // Dummy data oluştur
            const dummyData = {
                id: data.playerCode,
                name: userCode.name,
                status: 'tamamlandı',
                submissionDate: userCode.sentDate,
                completionDate: new Date(),
                validityDate: userCode.expiryDate,
                evaluationResult: evaluationResult,
                customerFocusScore: customerFocusScore.toFixed(2),
                uncertaintyScore: uncertaintyScore.toFixed(2)
            };

            // Dummy datayı Game modeline ekle
            const newGame = new Game({
                playerCode: data.playerCode,
                section: data.section,
                dummyData: dummyData,
                evaluationResult: evaluationResult,
                customerFocusScore: customerFocusScore.toFixed(2),
                uncertaintyScore: uncertaintyScore.toFixed(2)
            });

            await newGame.save();

            // WebSocket üzerinden güncellemeyi yayınla
            this.broadcastUpdate({
                type: 'newResult',
                data: dummyData
            });

            res.status(200).json({
                success: true,
                message: 'Oyun sonucu başarıyla kaydedildi',
                game: newGame
            });

        } catch (error) {
            console.error('Oyun sonucu kaydetme hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    async getReportsByAnswerType(answers) {
        try {
            // BY ve MO olanları ayrı gruplandır
            const byAnswers = answers.filter(answer => answer.answerSubCategory === 'BY');
            const moAnswers = answers.filter(answer => answer.answerSubCategory === 'MO');

            console.log('BY cevapları:', byAnswers);
            console.log('MO cevapları:', moAnswers);

            // BY cevaplarından answerType1 değerlerini al
            const byAnswerTypes = byAnswers.map(answer => answer.answerType1);
            console.log('BY answerType1 değerleri:', byAnswerTypes);

            // Boş olmayan BY cevaplarını filtrele
            const validByAnswerTypes = byAnswerTypes.filter(type => type && type !== '-');
            console.log('Geçerli BY answerType1 değerleri:', validByAnswerTypes);

            // BY cevaplarını string formatına çevir
            const byAnswerString = validByAnswerTypes.join(', ');
            console.log('BY cevapları string formatı:', byAnswerString);

            // Koleksiyon isimlerini kontrol et
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('Mevcut koleksiyonlar:', collections.map(c => c.name));

            // evaluationanswers koleksiyonunda BY cevaplarıyla arama yap
            const matched = await mongoose.connection.collection('evaluationanswers').findOne({
                Cevaplar: { $regex: new RegExp(byAnswerString, 'i') }
            });

            if (matched) {
                console.log('Eşleşen BY cevapları bulundu:', matched);
                // ID ile evaluationresults koleksiyonunda arama yap
                const evaluationResult = await mongoose.connection.collection('evaluationresults').findOne({ ID: matched.ID });
                console.log('Bulunan değerlendirme sonucu:', evaluationResult);
                
                if (evaluationResult) {
                    return {
                        MüşteriOdaklılık: evaluationResult.MüşteriOdaklılık || '-',
                        BelirsizlikYönetimi: evaluationResult.BelirsizlikYönetimi || '-'
                    };
                }
            }
            
            console.log('Eşleşen BY cevapları bulunamadı');
            return {
                MüşteriOdaklılık: '-',
                BelirsizlikYönetimi: '-'
            };
        } catch (error) {
            console.error('Sonuçlar alınırken hata:', error);
            return {
                MüşteriOdaklılık: '-',
                BelirsizlikYönetimi: '-'
            };
        }
    }

    // Sunucu durumu kontrolü
    async checkServerStatus(req, res) {
        res.json({ status: 'online' });
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