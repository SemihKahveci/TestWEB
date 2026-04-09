const { answerScores } = require('../config/constants');
const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');
const Section = require('../models/section');
const EvaluationController = require('./evaluationController');
const mongoose = require('mongoose');
const { sendEmail } = require('../services/emailService');
const {
    safeLog,
    getSafeErrorMessage,
    capitalizeName,
    escapeHtml,
    mergeUserCodeScoresBySection,
    mergeEvaluationResultsByType
} = require('../utils/helpers');

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

    // Yeni skor hesaplama fonksiyonu
    calculateQuestionScore(answer) {
        const score1 = answerScores[answer.answerType1] || 0;
        const score2 = answerScores[answer.answerType2] || 0;
        
        // Formül: (1. Soru puanı + (2.soru puanı*0,2))/1,2
        return (score1 + (score2 * 0.2)) / 1.2;
    }

    // Kategori skorunu hesapla (tüm soruların aritmetik ortalaması)
    calculateCategoryScore(answers) {
        if (!answers || answers.length === 0) {
            return 0;
        }
        
        const totalScore = answers.reduce((acc, answer) => {
            return acc + this.calculateQuestionScore(answer);
        }, 0);

        return totalScore / answers.length;
    }

   
    // Sonuçları getir
    async getResults(req, res) {
        try {
            // Multi-tenant: Super admin için tüm veriler, normal admin için sadece kendi company'si
            const companyFilter = getCompanyFilter(req);
            // Hem Game hem de UserCode verilerini al
            const games = await Game.find(companyFilter).sort({ date: -1 });
            const userCodes = await UserCode.find(companyFilter).sort({ sentDate: -1 });
            
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
            safeLog('error', 'Sonuçlar alınırken hata', error);
            res.status(500).json({ error: getSafeErrorMessage(error, this.errorMessages.serverError) });
        }
    }

    // Oyun sonucu kaydetme
    async registerGameResult(req, res) {
        try {
            const data = req.body;


            if (!data?.playerCode || !data?.section || !Array.isArray(data?.answers)) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidData,
                    receivedData: data
                });
            }

            // UserCode'u bul
            // Not: Oyun oynayan kullanıcı için companyId kontrolü yapılmaz, sadece kod kontrolü yapılır
            // Bu endpoint public'tir ve oyun oynayan kullanıcılar tarafından çağrılır
            const userCode = await UserCode.findOne({ code: data.playerCode });
            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            // Kod geçerlilik süresini kontrol et (71 saat sonra süresi dolmuş sayılır)
            const now = new Date();
            const earlyExpiryDate = new Date(userCode.expiryDate);
            earlyExpiryDate.setHours(earlyExpiryDate.getHours() - 1); // 1 saat önce süresi dolmuş sayılır
            
            if (now > earlyExpiryDate) {
                // Süresi dolmuşsa durumu güncelle
                userCode.status = 'Süresi Doldu';
                await userCode.save();
                
                return res.status(400).json({
                    success: false,
                    message: 'Kodun geçerlilik süresi dolmuş. Lütfen yeni bir kod talep edin.'
                });
            }

            // Skorları hesapla - Yeni sistem
            const customerFocusAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'MO'
            );
            const uncertaintyAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'BY'
            );
            const ieAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'IE'
            );
            const idikAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'IDIK'
            );

            // Yeni sistemle skorları hesapla
            const customerFocusScore = this.calculateCategoryScore(customerFocusAnswers);
            const uncertaintyScore = this.calculateCategoryScore(uncertaintyAnswers);
            const ieScore = this.calculateCategoryScore(ieAnswers);
            const idikScore = this.calculateCategoryScore(idikAnswers);
            // Değerlendirme sonuçlarını getir (bu tur / bu section cevapları)
            const evaluationResult = await this.getReportsByAnswerType(data.answers);

            const rounded = {
                customerFocusScore: Math.round(customerFocusScore),
                uncertaintyScore: Math.round(uncertaintyScore),
                ieScore: Math.round(ieScore),
                idikScore: Math.round(idikScore)
            };

            // UserCode tek kayıt: Venus ve Titan ayrı tamamlandığında skorlar ve raporlar birikir
            const mergedEvaluationResult = mergeEvaluationResultsByType(userCode.evaluationResult, evaluationResult);
            const mergedScores = mergeUserCodeScoresBySection(data.section, userCode, rounded);

            await UserCode.findOneAndUpdate(
                { code: data.playerCode },
                {
                    status: 'Tamamlandı',
                    isUsed: true,
                    completionDate: new Date(),
                    evaluationResult: mergedEvaluationResult,
                    ...mergedScores
                }
            );

            // Dummy data (bu section sonucu; WebSocket — UserCode birleşik skorları mergedScores ile DB'de)
            const dummyData = {
                id: data.playerCode,
                name: userCode.name,
                status: 'Tamamlandı',
                submissionDate: userCode.sentDate,
                completionDate: new Date(),
                validityDate: userCode.expiryDate,
                evaluationResult: evaluationResult,
                customerFocusScore: rounded.customerFocusScore,
                uncertaintyScore: rounded.uncertaintyScore,
                ieScore: rounded.ieScore,
                idikScore: rounded.idikScore
            };

            // Dummy datayı Game modeline ekle - companyId userCode'dan alınır
            const gameData = {
                playerCode: data.playerCode,
                section: data.section,
                answers: data.answers,
                dummyData: dummyData,
                evaluationResult: evaluationResult,
                customerFocusScore: Math.round(customerFocusScore),
                uncertaintyScore: Math.round(uncertaintyScore),
                ieScore: Math.round(ieScore),
                idikScore: Math.round(idikScore),
                companyId: userCode.companyId // UserCode'dan companyId'yi al
            };

            const newGame = new Game(gameData);
            await newGame.save();

            // Oyun tamamlandığında e-posta gönder
            try {
                const safeUserName = escapeHtml(capitalizeName(userCode.name));
                const completionEmailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <p><strong>Kaptan ${safeUserName},</strong></p>

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
                safeLog('error', 'Tamamlanma e-postası gönderme hatası', emailError);
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
            safeLog('error', 'Oyun sonucu kaydetme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, this.errorMessages.serverError)
            });
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
                safeLog('debug', 'BY raporları aranıyor, cevap string:', byAnswerString);
                
                // Virgülden sonra boşluk olan ve olmayan formatları dene
                const byAnswerStringNoSpace = byAnswerString.replace(/, /g, ',');
                safeLog('debug', 'BY raporları aranıyor (boşluksuz), cevap string:', byAnswerStringNoSpace);
                
                const matchedBY = await mongoose.connection.collection('evaluationanswers').findOne({
                    $or: [
                        { Cevaplar: byAnswerString },
                        { Cevaplar: byAnswerStringNoSpace }
                    ]
                });

                if (matchedBY) {
                    safeLog('debug', 'BY cevapları bulundu, ID:', matchedBY.ID);
                    const byResult = await mongoose.connection.collection('evaluationresults').findOne({ ID: matchedBY.ID });
                    
                    if (byResult) {
                        safeLog('debug', 'BY raporu bulundu ve eklendi');
                        results.push({ type: 'BY', data: byResult });
                    } else {
                        safeLog('debug', 'BY raporu bulunamadı, ID:', matchedBY.ID);
                    }
                } else {
                    safeLog('debug', 'BY cevapları bulunamadı, aranan string:', { byAnswerString, byAnswerStringNoSpace });
                }
            }

            // MO raporlarını kontrol et (Venus - Müşteri Odaklılık)
            if (moAnswerString) {
                safeLog('debug', 'MO raporları aranıyor, cevap string:', moAnswerString);
                
                // Virgülden sonra boşluk olan ve olmayan formatları dene
                const moAnswerStringNoSpace = moAnswerString.replace(/, /g, ',');
                safeLog('debug', 'MO raporları aranıyor (boşluksuz), cevap string:', moAnswerStringNoSpace);
                
                const matchedMO = await mongoose.connection.collection('evaluationanswersMY').findOne({
                    $or: [
                        { Cevaplar: moAnswerString },
                        { Cevaplar: moAnswerStringNoSpace }
                    ]
                });

                if (matchedMO) {
                    safeLog('debug', 'MO cevapları bulundu, ID:', matchedMO.ID);
                    const moResult = await mongoose.connection.collection('evaluationresultsMY').findOne({ ID: matchedMO.ID });
                    
                    if (moResult) {
                        safeLog('debug', 'MO raporu bulundu ve eklendi');
                        results.push({ type: 'MO', data: moResult });
                    } else {
                        safeLog('debug', 'MO raporu bulunamadı, ID:', matchedMO.ID);
                    }
                } else {
                    safeLog('debug', 'MO cevapları bulunamadı, aranan string:', { moAnswerString, moAnswerStringNoSpace });
                }
            }

            // IE raporlarını kontrol et (Titan - İnsanları Etkileme)
            if (ieAnswerString) {
                safeLog('debug', 'IE raporları aranıyor, cevap string:', ieAnswerString);
                
                // Virgülden sonra boşluk olan ve olmayan formatları dene
                const ieAnswerStringNoSpace = ieAnswerString.replace(/, /g, ',');
                safeLog('debug', 'IE raporları aranıyor (boşluksuz), cevap string:', ieAnswerStringNoSpace);
                
                const matchedIE = await mongoose.connection.collection('evaluationanswersHI').findOne({
                    $or: [
                        { Cevaplar: ieAnswerString },
                        { Cevaplar: ieAnswerStringNoSpace }
                    ]
                });

                if (matchedIE) {
                    safeLog('debug', 'IE cevapları bulundu, ID:', matchedIE.ID);
                    const ieResult = await mongoose.connection.collection('evaluationresultsHI').findOne({ ID: matchedIE.ID });
                    
                    if (ieResult) {
                        safeLog('debug', 'IE raporu bulundu ve eklendi');
                        results.push({ type: 'IE', data: ieResult });
                    } else {
                        safeLog('debug', 'IE raporu bulunamadı, ID:', matchedIE.ID);
                    }
                } else {
                    safeLog('debug', 'IE cevapları bulunamadı, aranan string:', { ieAnswerString, ieAnswerStringNoSpace });
                }
            }

            // IDIK raporlarını kontrol et (Titan - Güven Veren İşbirlikçi ve Sinerji)
            if (idikAnswerString) {
                safeLog('debug', 'IDIK raporları aranıyor, cevap string:', idikAnswerString);
                
                // Virgülden sonra boşluk olan ve olmayan formatları dene
                const idikAnswerStringNoSpace = idikAnswerString.replace(/, /g, ',');
                safeLog('debug', 'IDIK raporları aranıyor (boşluksuz), cevap string:', idikAnswerStringNoSpace);
                
                const matchedIDIK = await mongoose.connection.collection('evaluationanswersTW').findOne({
                    $or: [
                        { Cevaplar: idikAnswerString },
                        { Cevaplar: idikAnswerStringNoSpace }
                    ]
                });

                if (matchedIDIK) {
                    safeLog('debug', 'IDIK cevapları bulundu, ID:', matchedIDIK.ID);
                    const idikResult = await mongoose.connection.collection('evaluationresultsTW').findOne({ ID: matchedIDIK.ID });
                    
                    if (idikResult) {
                        safeLog('debug', 'IDIK raporu bulundu ve eklendi');
                        results.push({ type: 'IDIK', data: idikResult });
                    } else {
                        safeLog('debug', 'IDIK raporu bulunamadı, ID:', matchedIDIK.ID);
                    }
                } else {
                    safeLog('debug', 'IDIK cevapları bulunamadı, aranan string:', { idikAnswerString, idikAnswerStringNoSpace });
                }
            }

            // Eğer hiç sonuç bulunamadıysa null döndür
            if (results.length === 0) {
                return null;
            }

            // Bulunan tüm raporları döndür
            return results;

        } catch (error) {
            safeLog('error', 'Rapor sorgulama hatası', error);
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
            safeLog('error', 'Sonuçları silerken hata', error);
            res.status(500).json({ success: false, message: getSafeErrorMessage(error, 'Sonuçlar silinirken bir hata oluştu') });
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
            safeLog('debug', 'Oyun cevapları getiriliyor, kod:', code);
            
            // Game modelinden oyunu bul
            const game = await Game.findOne({ playerCode: code });
            
            if (!game) {
                safeLog('debug', 'Oyun bulunamadı, kod:', code);
                return res.status(404).json({
                    success: false,
                    message: 'Oyun bulunamadı'
                });
            }

            safeLog('debug', 'Oyun bulundu:', {
                playerCode: game.playerCode,
                section: game.section,
                answersCount: game.answers ? game.answers.length : 0,
                gameKeys: Object.keys(game.toObject())
            });

            // Eğer answers alanı yoksa, oyun verilerini kontrol et
            if (!game.answers || game.answers.length === 0) {
                safeLog('debug', 'Answers alanı bulunamadı, oyun verisi:', game.toObject());
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
                safeLog('debug', `Cevap ${index + 1}:`, answer);
                return {
                    questionNumber: index + 1,
                    questionID: answer.questionId || `Soru ${index + 1}`,
                    selectedAnswer1: answer.selectedAnswer1 || answer.answerType1 || '-',
                    selectedAnswer2: answer.selectedAnswer2 || answer.answerType2 || '-',
                    answerSubCategory: answer.answerSubCategory || '-',
                    section: answer.planetName || game.section || '-'
                };
            });

            safeLog('debug', 'Formatlanmış cevaplar:', { count: formattedAnswers.length });

            res.status(200).json({
                success: true,
                data: {
                    playerCode: game.playerCode,
                    section: game.section,
                    answers: formattedAnswers
                }
            });

        } catch (error) {
            safeLog('error', 'Oyun cevapları getirme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, this.errorMessages.serverError)
            });
        }
    }

}

module.exports = GameController; 