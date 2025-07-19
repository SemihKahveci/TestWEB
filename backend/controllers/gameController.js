const { answerMultipliers } = require('../config/constants');
const Game = require('../models/game');
const UserCode = require('../models/userCode');
const AnswerType = require('../models/answerType');
const Section = require('../models/section');
const EvaluationController = require('./evaluationController');
const mongoose = require('mongoose');
const { sendEmail } = require('../services/emailService');

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

            // Skorları hesapla - Venus Gezegeni
            const customerFocusAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'MO'
            );
            const uncertaintyAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'BY'
            );

            // MO skorunu hesapla (Venus - Müşteri Odaklılık)
            let customerFocusScore = 0;
            if (customerFocusAnswers.length > 0) {
                customerFocusScore = customerFocusAnswers.reduce((acc, answer) => {
                    const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                    const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                    return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                }, 0) / customerFocusAnswers.length;
            }
            customerFocusScore = customerFocusScore * 100;

            // BY skorunu hesapla (Venus - Belirsizlik Yönetimi)
            let uncertaintyScore = 0;
            if (uncertaintyAnswers.length > 0) {
                // 4. sorunun cevabı A ise özel hesaplama yap
                const question3Answer = uncertaintyAnswers.find(answer => answer.questionNumber === 3);
                const question4Answer = uncertaintyAnswers.find(answer => answer.questionNumber === 4);
                const question5Answer = uncertaintyAnswers.find(answer => answer.questionNumber === 5);
                
                // Özel hesaplama koşulları: 3. soru A, 4. soru A veya B, 5. soru var
                const isSpecialCalculation = question3Answer && 
                    question4Answer && 
                    question5Answer &&
                    question3Answer.answerType1 === 'A' && 
                    (question4Answer.answerType1 === 'A' || question4Answer.answerType1 === 'B');
                
                if (isSpecialCalculation) {
                    // 4. ve 5. sorunun puanlarının ortalamasını al
                    const score4 = ((answerMultipliers[question4Answer.answerType1] || 0) + (answerMultipliers[question4Answer.answerType2] || 0) / 2) * 2 / 3;
                    const score5 = ((answerMultipliers[question5Answer.answerType1] || 0) + (answerMultipliers[question5Answer.answerType2] || 0) / 2) * 2 / 3;
                    const combinedScore = (score4 + score5) / 2;
                    
                    // Diğer soruları normal hesapla
                    const otherAnswers = uncertaintyAnswers.filter(answer => answer.questionNumber !== 4 && answer.questionNumber !== 5);
                    let otherScores = 0;
                    
                    if (otherAnswers.length > 0) {
                        otherScores = otherAnswers.reduce((acc, answer) => {
                            const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                            const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                            return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                        }, 0);
                    }
                    
                    // Toplam skoru hesapla (4-5 kombinasyonu + diğer sorular)
                    const totalScore = combinedScore + otherScores;
                    uncertaintyScore = totalScore / (otherAnswers.length + 1); // +1 çünkü 4-5 kombinasyonu tek soru sayılıyor
                } else {
                    // Normal hesaplama (4. soru A değilse veya 5. soru yoksa)
                    uncertaintyScore = uncertaintyAnswers.reduce((acc, answer) => {
                        const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                        const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                        return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                    }, 0) / uncertaintyAnswers.length;
                }
            }
            uncertaintyScore = uncertaintyScore * 100;

            // Skorları hesapla - Titan Gezegeni
            const hiAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'HI'
            );
            const twAnswers = data.answers.filter(answer => 
                answer.answerSubCategory === 'TW'
            );

            // HI skorunu hesapla (Titan - Yeni yetenek)
            let hiScore = 0;
            if (hiAnswers.length > 0) {
                hiScore = hiAnswers.reduce((acc, answer) => {
                    const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                    const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                    return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                }, 0) / hiAnswers.length;
            }
            hiScore = hiScore * 100;

            // TW skorunu hesapla (Titan - Yeni yetenek)
            let twScore = 0;
            if (twAnswers.length > 0) {
                twScore = twAnswers.reduce((acc, answer) => {
                    const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                    const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                    return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                }, 0) / twAnswers.length;
            }
            twScore = twScore * 100;
            // Değerlendirme sonuçlarını getir
            console.log('=== registerGameResult - Değerlendirme sonuçları alınıyor ===');
            const evaluationResult = await this.getReportsByAnswerType(data.answers);
            console.log('Değerlendirme sonucu:', evaluationResult);
            console.log('Değerlendirme sonucu tipi:', typeof evaluationResult);
            console.log('Değerlendirme sonucu uzunluğu:', evaluationResult ? evaluationResult.length : 'null');

            // UserCode durumunu güncelle
            await UserCode.findOneAndUpdate(
                { code: data.playerCode },
                { 
                    status: 'Tamamlandı',
                    completionDate: new Date(),
                    evaluationResult: evaluationResult,
                    customerFocusScore: Math.round(customerFocusScore),
                    uncertaintyScore: Math.round(uncertaintyScore),
                    hiScore: Math.round(hiScore),
                    twScore: Math.round(twScore)
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
                hiScore: Math.round(hiScore),
                twScore: Math.round(twScore)
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
                hiScore: Math.round(hiScore),
                twScore: Math.round(twScore)
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

                console.log(`Tamamlanma e-postası gönderildi: ${userCode.email}`);
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
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    async getReportsByAnswerType(answers) {
        try {
            console.log('=== getReportsByAnswerType BAŞLADI ===');
            console.log('Gelen answers:', JSON.stringify(answers, null, 2));
            
            // Tüm yetenek türlerini gruplandır
            const byAnswers = answers.filter(answer => answer.answerSubCategory === 'BY');
            const moAnswers = answers.filter(answer => answer.answerSubCategory === 'MO');
            const hiAnswers = answers.filter(answer => answer.answerSubCategory === 'HI');
            const twAnswers = answers.filter(answer => answer.answerSubCategory === 'TW');
            
            console.log('Filtrelenmiş cevaplar:');
            console.log('- BY cevapları:', byAnswers.length, byAnswers.map(a => ({ questionId: a.questionId, answerType1: a.answerType1 })));
            console.log('- MO cevapları:', moAnswers.length, moAnswers.map(a => ({ questionId: a.questionId, answerType1: a.answerType1 })));
            console.log('- HI cevapları:', hiAnswers.length, hiAnswers.map(a => ({ questionId: a.questionId, answerType1: a.answerType1 })));
            console.log('- TW cevapları:', twAnswers.length, twAnswers.map(a => ({ questionId: a.questionId, answerType1: a.answerType1 })));
            
            // Cevapları answerType1 değerlerini al
            const byAnswerTypes = byAnswers.map(answer => answer.answerType1);
            const moAnswerTypes = moAnswers.map(answer => answer.answerType1);
            const hiAnswerTypes = hiAnswers.map(answer => answer.answerType1);
            const twAnswerTypes = twAnswers.map(answer => answer.answerType1);

            console.log('AnswerType1 değerleri:');
            console.log('- BY answerTypes:', byAnswerTypes);
            console.log('- MO answerTypes:', moAnswerTypes);
            console.log('- HI answerTypes:', hiAnswerTypes);
            console.log('- TW answerTypes:', twAnswerTypes);

            // Boş olmayan cevapları filtrele
            const validByAnswerTypes = byAnswerTypes.filter(type => type && type !== '-');
            const validMoAnswerTypes = moAnswerTypes.filter(type => type && type !== '-');
            const validHiAnswerTypes = hiAnswerTypes.filter(type => type && type !== '-');
            const validTwAnswerTypes = twAnswerTypes.filter(type => type && type !== '-');

            console.log('Geçerli answerTypes:');
            console.log('- Valid BY:', validByAnswerTypes);
            console.log('- Valid MO:', validMoAnswerTypes);
            console.log('- Valid HI:', validHiAnswerTypes);
            console.log('- Valid TW:', validTwAnswerTypes);

            // Cevapları string formatına çevir
            const byAnswerString = validByAnswerTypes.join(', ');
            const moAnswerString = validMoAnswerTypes.join(', ');
            const hiAnswerString = validHiAnswerTypes.join(', ');
            const twAnswerString = validTwAnswerTypes.join(', ');

            console.log('Oluşturulan string\'ler:');
            console.log('- BY string:', `"${byAnswerString}"`);
            console.log('- MO string:', `"${moAnswerString}"`);
            console.log('- HI string:', `"${hiAnswerString}"`);
            console.log('- TW string:', `"${twAnswerString}"`);

            let results = [];

            // BY raporlarını kontrol et (Venus - Belirsizlik Yönetimi)
            if (byAnswerString) {
                console.log('BY raporu aranıyor...');
                console.log('Arama string:', byAnswerString);
                
                const matchedBY = await mongoose.connection.collection('evaluationanswers').findOne({
                    Cevaplar: { $regex: new RegExp(byAnswerString, 'i') }
                });

                console.log('BY eşleşmesi:', matchedBY ? 'BULUNDU' : 'BULUNAMADI');
                if (matchedBY) {
                    console.log('BY ID:', matchedBY.ID);
                    
                    const byResult = await mongoose.connection.collection('evaluationresults').findOne({ ID: matchedBY.ID });
                    console.log('BY sonucu:', byResult ? 'BULUNDU' : 'BULUNAMADI');
                    
                    if (byResult) {
                        results.push({ type: 'BY', data: byResult });
                        console.log('BY raporu eklendi');
                    }
                }
            } else {
                console.log('BY string boş, arama yapılmadı');
            }

            // MO raporlarını kontrol et (Venus - Müşteri Odaklılık)
            if (moAnswerString) {
                console.log('MO raporu aranıyor...');
                console.log('Arama string:', moAnswerString);
                
                const matchedMO = await mongoose.connection.collection('evaluationanswersMY').findOne({
                    $or: [
                        { Cevaplar: { $regex: new RegExp(moAnswerString, 'i') } },
                        { Cevaplar: { $regex: new RegExp(moAnswerString.replace(/, /g, ','), 'i') } }
                    ]
                });

                console.log('MO eşleşmesi:', matchedMO ? 'BULUNDU' : 'BULUNAMADI');
                if (matchedMO) {
                    console.log('MO ID:', matchedMO.ID);
                    
                    const moResult = await mongoose.connection.collection('evaluationresultsMY').findOne({ ID: matchedMO.ID });
                    console.log('MO sonucu:', moResult ? 'BULUNDU' : 'BULUNAMADI');
                    
                    if (moResult) {
                        results.push({ type: 'MO', data: moResult });
                        console.log('MO raporu eklendi');
                    }
                }
            } else {
                console.log('MO string boş, arama yapılmadı');
            }

            // HI raporlarını kontrol et (Titan - Yeni yetenek)
            if (hiAnswerString) {
                console.log('HI raporu aranıyor...');
                console.log('Arama string:', hiAnswerString);
                
                // Collection'ın varlığını kontrol et
                const collections = await mongoose.connection.db.listCollections().toArray();
                const collectionNames = collections.map(c => c.name);
                console.log('Mevcut collection\'lar:', collectionNames);
                console.log('evaluationanswersHI collection var mı:', collectionNames.includes('evaluationanswersHI'));
                
                const matchedHI = await mongoose.connection.collection('evaluationanswersHI').findOne({
                    $or: [
                        { Cevaplar: { $regex: new RegExp(hiAnswerString, 'i') } },
                        { Cevaplar: { $regex: new RegExp(hiAnswerString.replace(/, /g, ','), 'i') } }
                    ]
                });

                console.log('HI eşleşmesi:', matchedHI ? 'BULUNDU' : 'BULUNAMADI');
                if (matchedHI) {
                    console.log('HI ID:', matchedHI.ID);
                    console.log('HI Cevaplar:', matchedHI.Cevaplar);
                    
                    const hiResult = await mongoose.connection.collection('evaluationresultsHI').findOne({ ID: matchedHI.ID });
                    console.log('HI sonucu:', hiResult ? 'BULUNDU' : 'BULUNAMADI');
                    
                    if (hiResult) {
                        results.push({ type: 'HI', data: hiResult });
                        console.log('HI raporu eklendi');
                    }
                } else {
                    // Eşleşme bulunamadıysa collection'daki örnek verileri göster
                    const sampleHI = await mongoose.connection.collection('evaluationanswersHI').findOne();
                    console.log('HI collection örnek veri:', sampleHI ? sampleHI.Cevaplar : 'COLLECTION BOŞ');
                }
            } else {
                console.log('HI string boş, arama yapılmadı');
            }

            // TW raporlarını kontrol et (Titan - Yeni yetenek)
            if (twAnswerString) {
                console.log('TW raporu aranıyor...');
                console.log('Arama string:', twAnswerString);
                
                // Collection'ın varlığını kontrol et
                const collections = await mongoose.connection.db.listCollections().toArray();
                const collectionNames = collections.map(c => c.name);
                console.log('evaluationanswersTW collection var mı:', collectionNames.includes('evaluationanswersTW'));
                
                const matchedTW = await mongoose.connection.collection('evaluationanswersTW').findOne({
                    $or: [
                        { Cevaplar: { $regex: new RegExp(twAnswerString, 'i') } },
                        { Cevaplar: { $regex: new RegExp(twAnswerString.replace(/, /g, ','), 'i') } }
                    ]
                });

                console.log('TW eşleşmesi:', matchedTW ? 'BULUNDU' : 'BULUNAMADI');
                if (matchedTW) {
                    console.log('TW ID:', matchedTW.ID);
                    console.log('TW Cevaplar:', matchedTW.Cevaplar);
                    
                    const twResult = await mongoose.connection.collection('evaluationresultsTW').findOne({ ID: matchedTW.ID });
                    console.log('TW sonucu:', twResult ? 'BULUNDU' : 'BULUNAMADI');
                    
                    if (twResult) {
                        results.push({ type: 'TW', data: twResult });
                        console.log('TW raporu eklendi');
                    }
                } else {
                    // Eşleşme bulunamadıysa collection'daki örnek verileri göster
                    const sampleTW = await mongoose.connection.collection('evaluationanswersTW').findOne();
                    console.log('TW collection örnek veri:', sampleTW ? sampleTW.Cevaplar : 'COLLECTION BOŞ');
                }
            } else {
                console.log('TW string boş, arama yapılmadı');
            }

            // Eğer hiç sonuç bulunamadıysa null döndür
            if (results.length === 0) {
                console.log('Hiç sonuç bulunamadı, null döndürülüyor');
                return null;
            }

            // Bulunan tüm raporları döndür
            console.log('Bulunan raporlar:', results.map(r => r.type));
            console.log('=== getReportsByAnswerType BİTTİ ===');
            return results;

        } catch (error) {
            console.error('Rapor sorgulama hatası:', error);
            console.error('Hata detayı:', error.stack);
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
}

module.exports = GameController; 