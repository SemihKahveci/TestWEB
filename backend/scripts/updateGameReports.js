require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('../models/game');
const UserCode = require('../models/userCode');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

class GameReportUpdater {
    constructor() {
        this.updatedCount = 0;
        this.errorCount = 0;
    }

    // Rapor eşleştirme fonksiyonu (yeni tam eşleşme sistemi)
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
                const byAnswerStringNoSpace = byAnswerString.replace(/, /g, ',');
                
                const matchedBY = await mongoose.connection.collection('evaluationanswers').findOne({
                    $or: [
                        { Cevaplar: byAnswerString },
                        { Cevaplar: byAnswerStringNoSpace }
                    ]
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
                const moAnswerStringNoSpace = moAnswerString.replace(/, /g, ',');
                
                const matchedMO = await mongoose.connection.collection('evaluationanswersMY').findOne({
                    $or: [
                        { Cevaplar: moAnswerString },
                        { Cevaplar: moAnswerStringNoSpace }
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
                const ieAnswerStringNoSpace = ieAnswerString.replace(/, /g, ',');
                
                const matchedIE = await mongoose.connection.collection('evaluationanswersHI').findOne({
                    $or: [
                        { Cevaplar: ieAnswerString },
                        { Cevaplar: ieAnswerStringNoSpace }
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
                const idikAnswerStringNoSpace = idikAnswerString.replace(/, /g, ',');
                
                const matchedIDIK = await mongoose.connection.collection('evaluationanswersTW').findOne({
                    $or: [
                        { Cevaplar: idikAnswerString },
                        { Cevaplar: idikAnswerStringNoSpace }
                    ]
                });

                if (matchedIDIK) {
                    const idikResult = await mongoose.connection.collection('evaluationresultsTW').findOne({ ID: matchedIDIK.ID });
                    if (idikResult) {
                        results.push({ type: 'IDIK', data: idikResult });
                    }
                }
            }

            return results.length > 0 ? results : null;

        } catch (error) {
            console.error('Rapor sorgulama hatası:', error);
            return null;
        }
    }

    // Tek bir oyunu güncelle
    async updateGameReports(game) {
        try {
            console.log(`\n🔄 Güncelleniyor: ${game.playerCode} (Section: ${game.section})`);
            
            if (!game.answers || game.answers.length === 0) {
                console.log('❌ Cevap bulunamadı, atlanıyor...');
                return false;
            }

            // Yeni rapor eşleştirme sistemi ile raporları bul
            const newEvaluationResult = await this.getReportsByAnswerType(game.answers);
            
            if (!newEvaluationResult) {
                console.log('❌ Yeni rapor bulunamadı');
                return false;
            }

            // Eski ve yeni raporları karşılaştır
            const oldReports = Array.isArray(game.evaluationResult) ? game.evaluationResult : [game.evaluationResult];
            const oldReportIds = oldReports.map(r => r?.data?.ID).filter(Boolean);
            const newReportIds = newEvaluationResult.map(r => r.data.ID);

            console.log(`📊 Eski raporlar: [${oldReportIds.join(', ')}]`);
            console.log(`📊 Yeni raporlar: [${newReportIds.join(', ')}]`);

            // Eğer raporlar farklıysa güncelle
            const isDifferent = JSON.stringify(oldReportIds.sort()) !== JSON.stringify(newReportIds.sort());
            
            if (isDifferent) {
                // Game modelini güncelle
                await Game.findByIdAndUpdate(game._id, {
                    evaluationResult: newEvaluationResult
                });

                // UserCode modelini de güncelle
                await UserCode.findOneAndUpdate(
                    { code: game.playerCode },
                    { evaluationResult: newEvaluationResult }
                );

                console.log('✅ Raporlar güncellendi!');
                this.updatedCount++;
                return true;
            } else {
                console.log('ℹ️ Raporlar aynı, güncelleme gerekmiyor');
                return false;
            }

        } catch (error) {
            console.error(`❌ Hata (${game.playerCode}):`, error.message);
            this.errorCount++;
            return false;
        }
    }

    // Tüm oyunları güncelle
    async updateAllGames() {
        try {
            console.log('🚀 Oyun raporları güncelleme işlemi başlıyor...\n');

            // Tüm tamamlanmış oyunları bul
            const games = await Game.find({
                evaluationResult: { $exists: true, $ne: null }
            }).sort({ date: -1 });

            console.log(`📋 Toplam ${games.length} oyun bulundu\n`);

            for (const game of games) {
                await this.updateGameReports(game);
            }

            console.log('\n🎉 Güncelleme tamamlandı!');
            console.log(`✅ Güncellenen: ${this.updatedCount} oyun`);
            console.log(`❌ Hata olan: ${this.errorCount} oyun`);
            console.log(`📊 Toplam: ${games.length} oyun`);

        } catch (error) {
            console.error('❌ Genel hata:', error);
        } finally {
            mongoose.connection.close();
        }
    }

    // Belirli bir kodu güncelle
    async updateSpecificCode(playerCode) {
        try {
            console.log(`🎯 Belirli kod güncelleniyor: ${playerCode}\n`);

            const games = await Game.find({ playerCode });
            
            if (games.length === 0) {
                console.log('❌ Bu kod için oyun bulunamadı');
                return;
            }

            console.log(`📋 ${games.length} oyun bulundu\n`);

            for (const game of games) {
                await this.updateGameReports(game);
            }

            console.log('\n🎉 Güncelleme tamamlandı!');
            console.log(`✅ Güncellenen: ${this.updatedCount} oyun`);

        } catch (error) {
            console.error('❌ Hata:', error);
        } finally {
            mongoose.connection.close();
        }
    }
}

// Script kullanımı
async function main() {
    const updater = new GameReportUpdater();
    
    // Komut satırı argümanlarını kontrol et
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Belirli bir kod güncelle
        await updater.updateSpecificCode(args[0]);
    } else {
        // Tüm oyunları güncelle
        await updater.updateAllGames();
    }
}

// Script'i çalıştır
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GameReportUpdater;
