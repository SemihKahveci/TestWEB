const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');
const mongoose = require('mongoose');
const { sendEmail } = require('../services/emailService');
const CodeValidationUtils = require('../utils/codeValidation');
const CommonUtils = require('../utils/commonUtils');
const errorMessages = require('../utils/errorMessages');
const ScoreCalculator = require('../utils/scoreCalculator');

class GameController {
    constructor(wss) {
        this.wss = wss;
        this.clients = new Set();
        // Error messages artık merkezi sistemden geliyor
    }

   
    // Sonuçları getir
    async getResults(req, res) {
        try {
            // Hem Game hem de UserCode verilerini al
            const games = await Game.find().sort({ date: -1 });
            const userCodes = await UserCode.find().sort({ sentDate: -1 });
            
            if (!games || games.length === 0) {
                return res.status(200).json([]);
            }

            const formattedData = games.map(game => {
                // UserCode'dan ilgili veriyi bul
                const userCode = userCodes.find(uc => uc.code === game.playerCode);
                
                return {
                    playerCode: game.playerCode || '-',
                    section: game.section || '-',
                    date: game.date,
                    dummyData: game.dummyData,
                    evaluationResult: game.evaluationResult,
                    // Results.html için gerekli alanlar
                    code: game.playerCode,
                    name: game.dummyData?.name || userCode?.name || '-',
                    sentDate: userCode?.sentDate || game.sentDate,
                    completionDate: userCode?.completionDate || game.completionDate,
                    expiryDate: userCode?.expiryDate || game.expiryDate,
                    status: userCode?.status || game.status,
                    // Skorları hem Game hem UserCode'dan al, öncelik UserCode'da
                    customerFocusScore: userCode?.customerFocusScore || game.customerFocusScore || '-',
                    uncertaintyScore: userCode?.uncertaintyScore || game.uncertaintyScore || '-',
                    ieScore: userCode?.ieScore || game.ieScore || '-',
                    idikScore: userCode?.idikScore || game.idikScore || '-'
                };
            });

            res.status(200).json(formattedData);
        } catch (error) {
            console.error('Sonuçlar alınırken hata:', error);
            res.status(500).json(
                errorMessages.create('Sonuçlar alınırken hata oluştu')
            );
        }
    }

    // Oyun sonucu kaydetme
    async registerGameResult(req, res) {
        try {
            const data = req.body;


            if (!data?.playerCode || !data?.section || !Array.isArray(data?.answers)) {
                return res.status(400).json(
                    errorMessages.create('Geçersiz veri formatı')
                );
            }

            // Ortak doğrulama fonksiyonunu kullan (isUsed kontrolü yapmaz çünkü oyun zaten başlamış)
            let userCode;
            try {
                userCode = await UserCode.findOne({ code: data.playerCode });
                if (!userCode) {
                    return res.status(400).json(
                        errorMessages.create('Geçersiz kod')
                    );
                }

                // Sadece süre kontrolü yap (isUsed kontrolü yapma çünkü oyun zaten başlamış)
                const expiryCheck = CodeValidationUtils.checkCodeExpiry(userCode.expiryDate);
                if (expiryCheck.isExpired) {
                    userCode.status = 'Süresi Doldu';
                    await userCode.save();
                    
                    return res.status(400).json({
                        success: false,
                        message: 'Kodun geçerlilik süresi dolmuş. Lütfen yeni bir kod talep edin.'
                    });
                }
                            } catch (error) {
                    return res.status(400).json(
                        errorMessages.create(error.message || 'Geçersiz kod')
                    );
                }

            // Tüm skorları hesapla
            const scores = ScoreCalculator.calculateAllScores(data.answers);
            const { customerFocusScore, uncertaintyScore, ieScore, idikScore } = scores; 
            // Değerlendirme sonuçlarını getir
            const evaluationResult = await this.getReportsByAnswerType(data.answers);

            // UserCode durumunu güncelle
            await UserCode.findOneAndUpdate(
                { code: data.playerCode },
                { 
                    status: 'Tamamlandı',
                    isUsed: true, // Kodu kullanılmış olarak işaretle
                    completionDate: new Date(),
                    evaluationResult: evaluationResult,
                    customerFocusScore: Math.round(customerFocusScore),
                    uncertaintyScore: Math.round(uncertaintyScore),
                    ieScore: Math.round(ieScore),
                    idikScore: Math.round(idikScore)
                }
            );

            // Dummy data oluştur
            const dummyData = {
                id: data.playerCode,
                name: userCode.name,
                status: 'Tamamlandı',
                submissionDate: userCode.sentDate,
                completionDate: new Date(),
                validityDate: userCode.expiryDate,
                evaluationResult: evaluationResult,
                customerFocusScore: Math.round(customerFocusScore),
                uncertaintyScore: Math.round(uncertaintyScore),
                ieScore: Math.round(ieScore),
                idikScore: Math.round(idikScore)
            };

            // Dummy datayı Game modeline ekle
            const newGame = new Game({
                playerCode: data.playerCode,
                section: data.section,
                answers: data.answers,
                dummyData: dummyData,
                evaluationResult: evaluationResult,
                customerFocusScore: Math.round(customerFocusScore),
                uncertaintyScore: Math.round(uncertaintyScore),
                ieScore: Math.round(ieScore),
                idikScore: Math.round(idikScore)
            });

            await newGame.save();

            // Oyun tamamlandığında e-posta gönder
            try {
                const completionEmailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <p><strong>Kaptan ${userCode.name},</strong></p>

                        <p>Tebrikler, ANDRON Evreni'ndeki keşif maceranı başarıyla tamamladın! 🚀</p>

                        <p>Görev boyunca aldığın veriler ve kararların, ANDRON Komuta Merkezi'ne eksiksiz ulaştı.</p>

                        <p>Keyifli keşifler ve yeni görevlerde görüşmek üzere, Kaptan!<br>
                        <strong>ANDRON Game Ekibi</strong></p>
                    </div>
                `;

                await sendEmail(
                    userCode.email,
                    'Görev Başarıyla Tamamlandı!',
                    completionEmailHtml
                );
            } catch (emailError) {
                console.error('Tamamlanma e-postası gönderme hatası:', emailError);
                // E-posta hatası oyun kaydetmeyi etkilemesin
            }

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
            res.status(500).json(
                errorMessages.create('Oyun sonucu kaydetme hatası')
            );
        }
    }

    async getReportsByAnswerType(answers) {
        try {
            // Tüm yetenek türlerini gruplandır
            const byAnswers = answers.filter(answer => answer.answerSubCategory === 'BY');
            const moAnswers = answers.filter(answer => answer.answerSubCategory === 'MO');
            const ieAnswers = answers.filter(answer => answer.answerSubCategory === 'IE');
            const idikAnswers = answers.filter(answer => answer.answerSubCategory === 'IDIK');
            
            // Cevapları answerType1 değerlerini al
            const byAnswerTypes = byAnswers.map(answer => answer.answerType1);
            const moAnswerTypes = moAnswers.map(answer => answer.answerType1);
            const ieAnswerTypes = ieAnswers.map(answer => answer.answerType1);
            const idikAnswerTypes = idikAnswers.map(answer => answer.answerType1);

            // Boş olmayan cevapları filtrele
            const validByAnswerTypes = byAnswerTypes.filter(type => type && type !== '-');
            const validMoAnswerTypes = moAnswerTypes.filter(type => type && type !== '-');
            const validIeAnswerTypes = ieAnswerTypes.filter(type => type && type !== '-');
            const validIdikAnswerTypes = idikAnswerTypes.filter(type => type && type !== '-');

            // Cevapları string formatına çevir
            const byAnswerString = validByAnswerTypes.join(', ');
            const moAnswerString = validMoAnswerTypes.join(', ');
            const ieAnswerString = validIeAnswerTypes.join(', ');
            const idikAnswerString = validIdikAnswerTypes.join(', ');

            let results = [];

            // BY raporlarını kontrol et (Venus - Belirsizlik Yönetimi)
            if (byAnswerString) {
                const matchedBY = await mongoose.connection.collection('evaluationanswers').findOne({
                    Cevaplar: { $regex: new RegExp(byAnswerString, 'i') }
                });

                if (matchedBY) {
                    const byResult = await mongoose.connection.collection('evaluationresults').findOne({ ID: matchedBY.ID });
                    
                    if (byResult) {
                        results.push({ type: 'BY', data: byResult });
                    }
                }
            }

            // MO raporlarını kontrol et (Venus - Müşteri Odaklılık)
            if (moAnswerString) {
                const matchedMO = await mongoose.connection.collection('evaluationanswersMY').findOne({
                    $or: [
                        { Cevaplar: { $regex: new RegExp(moAnswerString, 'i') } },
                        { Cevaplar: { $regex: new RegExp(moAnswerString.replace(/, /g, ','), 'i') } }
                    ]
                });

                if (matchedMO) {
                    const moResult = await mongoose.connection.collection('evaluationresultsMY').findOne({ ID: matchedMO.ID });
                    
                    if (moResult) {
                        results.push({ type: 'MO', data: moResult });
                    }
                }
            }

            // IE raporlarını kontrol et (Titan - İnsanları Etkileme)
            if (ieAnswerString) {
                const matchedIE = await mongoose.connection.collection('evaluationanswersHI').findOne({
                    $or: [
                        { Cevaplar: { $regex: new RegExp(ieAnswerString, 'i') } },
                        { Cevaplar: { $regex: new RegExp(ieAnswerString.replace(/, /g, ','), 'i') } }
                    ]
                });

                if (matchedIE) {
                    const ieResult = await mongoose.connection.collection('evaluationresultsHI').findOne({ ID: matchedIE.ID });
                    
                    if (ieResult) {
                        results.push({ type: 'IE', data: ieResult });
                    }
                }
            }

            // IDIK raporlarını kontrol et (Titan - Güven Veren İşbirlikçi ve Sinerji)
            if (idikAnswerString) {
                const matchedIDIK = await mongoose.connection.collection('evaluationanswersTW').findOne({
                    $or: [
                        { Cevaplar: { $regex: new RegExp(idikAnswerString, 'i') } },
                        { Cevaplar: { $regex: new RegExp(idikAnswerString.replace(/, /g, ','), 'i') } }
                    ]
                });

                if (matchedIDIK) {
                    const idikResult = await mongoose.connection.collection('evaluationresultsTW').findOne({ ID: matchedIDIK.ID });
                    
                    if (idikResult) {
                        results.push({ type: 'IDIK', data: idikResult });
                    }
                }
            }

            // Eğer hiç sonuç bulunamadıysa null döndür
            if (results.length === 0) {
                return null;
            }

            // Bulunan tüm raporları döndür
            return results;

        } catch (error) {
            console.error('Rapor sorgulama hatası:', error);
            return null;
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

    // Oyun cevaplarını getir
    async getGameAnswers(req, res) {
        try {
            const { code } = req.params;
            console.log('Oyun cevapları getiriliyor, kod:', code);
            
            // Game modelinden oyunu bul
            const game = await Game.findOne({ playerCode: code });
            
            if (!game) {
                console.log('Oyun bulunamadı, kod:', code);
                return res.status(404).json({
                    success: false,
                    message: 'Oyun bulunamadı'
                });
            }

            console.log('Oyun bulundu:', {
                playerCode: game.playerCode,
                section: game.section,
                answersCount: game.answers ? game.answers.length : 0,
                gameKeys: Object.keys(game.toObject())
            });

            // Eğer answers alanı yoksa, oyun verilerini kontrol et
            if (!game.answers || game.answers.length === 0) {
                console.log('Answers alanı bulunamadı, oyun verisi:', JSON.stringify(game.toObject(), null, 2));
                return res.status(200).json({
                    success: true,
                    data: {
                        playerCode: game.playerCode,
                        section: game.section,
                        answers: [],
                        message: 'Bu oyun için cevap verisi bulunamadı'
                    }
                });
            }

            // Cevapları formatla - Game modelindeki doğru alan isimlerini kullan
            const formattedAnswers = game.answers.map((answer, index) => {
                console.log(`Cevap ${index + 1}:`, answer);
                return {
                    questionNumber: index + 1,
                    questionID: answer.questionId || `Soru ${index + 1}`,
                    selectedAnswer1: answer.selectedAnswer1 || answer.answerType1 || '-',
                    selectedAnswer2: answer.selectedAnswer2 || answer.answerType2 || '-',
                    answerSubCategory: answer.answerSubCategory || '-',
                    section: answer.planetName || game.section || '-'
                };
            });

            console.log('Formatlanmış cevaplar:', formattedAnswers.length, 'cevap');

            res.status(200).json({
                success: true,
                data: {
                    playerCode: game.playerCode,
                    section: game.section,
                    answers: formattedAnswers
                }
            });

        } catch (error) {
            console.error('Oyun cevapları getirme hatası:', error);
            res.status(500).json(
                errorMessages.create('Oyun cevapları getirme hatası')
            );
        }
    }

}

module.exports = GameController; 