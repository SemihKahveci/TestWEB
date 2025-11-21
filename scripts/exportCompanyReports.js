/**
 * Şirket Raporlarını Toplu Export Script'i
 * 
 * Kullanım:
 * node scripts/exportCompanyReports.js <companyId> [format]
 * 
 * Örnekler:
 * node scripts/exportCompanyReports.js 507f1f77bcf86cd799439011 excel
 * node scripts/exportCompanyReports.js 507f1f77bcf86cd799439011 pdf
 */

require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const UserCode = require('../backend/models/userCode');
const Game = require('../backend/models/game');
const CompanyManagement = require('../backend/models/companyManagement');
const { safeLog } = require('../backend/utils/helpers');

// MongoDB bağlantısı
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adminpanel', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        safeLog('log', 'MongoDB bağlantısı başarılı');
    } catch (error) {
        safeLog('error', 'MongoDB bağlantı hatası', error);
        process.exit(1);
    }
};

/**
 * Şirket raporlarını Excel formatında export eder
 */
const exportToExcel = async (companyId, companyName) => {
    try {
        // Tüm UserCode'ları bul
        const userCodes = await UserCode.find({ companyId }).sort({ sentDate: -1 });
        
        if (userCodes.length === 0) {
            safeLog('warn', `Şirket için hiç rapor bulunamadı: ${companyName} (${companyId})`);
            return null;
        }

        safeLog('log', `${userCodes.length} adet kullanıcı kodu bulundu`);

        // Excel verilerini hazırla
        const excelData = [];
        const playerCodes = userCodes.map(uc => uc.code);

        // Tüm Game kayıtlarını tek sorguda çek
        const allGames = await Game.find({ 
            playerCode: { $in: playerCodes },
            companyId 
        }).select('playerCode section customerFocusScore uncertaintyScore ieScore idikScore evaluationResult');

        // Game'leri playerCode'a göre grupla
        const gamesByPlayerCode = {};
        allGames.forEach(game => {
            if (!gamesByPlayerCode[game.playerCode]) {
                gamesByPlayerCode[game.playerCode] = [];
            }
            gamesByPlayerCode[game.playerCode].push(game);
        });

        // Her kullanıcı için veri oluştur
        for (const userCode of userCodes) {
            const games = gamesByPlayerCode[userCode.code] || [];
            
            // Skorları belirle
            const venusGame = games.find(g => g.section === '0' || g.section === 0);
            const titanGame = games.find(g => g.section === '1' || g.section === 1);
            
            let customerFocusScore = (venusGame ? venusGame.customerFocusScore : null) || userCode.customerFocusScore || '-';
            let uncertaintyScore = (venusGame ? venusGame.uncertaintyScore : null) || userCode.uncertaintyScore || '-';
            let ieScore = (titanGame ? titanGame.ieScore : null) || userCode.ieScore || '-';
            let idikScore = (titanGame ? titanGame.idikScore : null) || userCode.idikScore || '-';

            // Eğer hiç oyun yoksa, sadece temel bilgileri ekle
            if (games.length === 0) {
                excelData.push({
                    'Ad Soyad': userCode.name || '-',
                    'Kod': userCode.code || '-',
                    'Durum': userCode.status || '-',
                    'Gönderim Tarihi': userCode.sentDate ? new Date(userCode.sentDate).toLocaleDateString('tr-TR') : '-',
                    'Tamamlanma Tarihi': userCode.completionDate ? new Date(userCode.completionDate).toLocaleDateString('tr-TR') : '-',
                    'Müşteri Odaklılık Skoru': customerFocusScore,
                    'Belirsizlik Yönetimi Skoru': uncertaintyScore,
                    'İnsanları Etkileme Skoru': ieScore,
                    'Güven Veren İşbirlikçi Skoru': idikScore,
                    'Ölçülen Yetkinlik': '-',
                    'Genel Değerlendirme': '-',
                    'Güçlü Yönler': '-',
                    'Gelişim Alanları': '-',
                    'Mülakat Soruları': '-',
                    'Neden Bu Sorular?': '-',
                    'Gelişim Planı': '-'
                });
                continue;
            }

            // Her oyun için ayrı satır oluştur
            let hasEvaluationResult = false;
            for (const game of games) {
                if (game.evaluationResult && game.evaluationResult.length > 0) {
                    hasEvaluationResult = true;
                    for (const evalResult of game.evaluationResult) {
                        if (evalResult.data && evalResult.data.ID) {
                            // Yetkinlik adını belirle
                            let yetkinlikAdi = 'Bilinmeyen Yetkinlik';
                            if (evalResult.type === 'MO') {
                                yetkinlikAdi = 'Müşteri Odaklılık';
                            } else if (evalResult.type === 'BY') {
                                yetkinlikAdi = 'Belirsizlik Yönetimi';
                            } else if (evalResult.type === 'IE') {
                                yetkinlikAdi = 'İnsanları Etkileme';
                            } else if (evalResult.type === 'IDIK') {
                                yetkinlikAdi = 'Güven Veren İşbirlikçi ve Sinerji';
                            }

                            // Yetkinlik skorunu belirle
                            let yetkinlikSkoru = '-';
                            if (evalResult.type === 'MO') {
                                yetkinlikSkoru = customerFocusScore;
                            } else if (evalResult.type === 'BY') {
                                yetkinlikSkoru = uncertaintyScore;
                            } else if (evalResult.type === 'IE') {
                                yetkinlikSkoru = ieScore;
                            } else if (evalResult.type === 'IDIK') {
                                yetkinlikSkoru = idikScore;
                            }

                            excelData.push({
                                'Ad Soyad': userCode.name || '-',
                                'Kod': userCode.code || '-',
                                'Durum': userCode.status || '-',
                                'Gönderim Tarihi': userCode.sentDate ? new Date(userCode.sentDate).toLocaleDateString('tr-TR') : '-',
                                'Tamamlanma Tarihi': userCode.completionDate ? new Date(userCode.completionDate).toLocaleDateString('tr-TR') : '-',
                                'Müşteri Odaklılık Skoru': customerFocusScore,
                                'Belirsizlik Yönetimi Skoru': uncertaintyScore,
                                'İnsanları Etkileme Skoru': ieScore,
                                'Güven Veren İşbirlikçi Skoru': idikScore,
                                'Ölçülen Yetkinlik': yetkinlikAdi,
                                'Yetkinlik Skoru': yetkinlikSkoru,
                                'Genel Değerlendirme': evalResult.data['Genel Değerlendirme'] || '-',
                                'Güçlü Yönler': evalResult.data['Güçlü Yönler'] || '-',
                                'Gelişim Alanları': evalResult.data['Gelişim Alanları'] || '-',
                                'Mülakat Soruları': evalResult.data['Mülakat Soruları'] || '-',
                                'Neden Bu Sorular?': evalResult.data['Neden Bu Sorular?'] || '-',
                                'Gelişim Planı': evalResult.data['Gelişim Önerileri -1'] || evalResult.data['Gelişim Önerileri -2'] || evalResult.data['Gelişim Önerileri - 3'] || '-'
                            });
                        }
                    }
                }
            }

            // Eğer hiç evaluationResult yoksa, sadece temel bilgileri ekle
            if (!hasEvaluationResult) {
                excelData.push({
                    'Ad Soyad': userCode.name || '-',
                    'Kod': userCode.code || '-',
                    'Durum': userCode.status || '-',
                    'Gönderim Tarihi': userCode.sentDate ? new Date(userCode.sentDate).toLocaleDateString('tr-TR') : '-',
                    'Tamamlanma Tarihi': userCode.completionDate ? new Date(userCode.completionDate).toLocaleDateString('tr-TR') : '-',
                    'Müşteri Odaklılık Skoru': customerFocusScore,
                    'Belirsizlik Yönetimi Skoru': uncertaintyScore,
                    'İnsanları Etkileme Skoru': ieScore,
                    'Güven Veren İşbirlikçi Skoru': idikScore,
                    'Ölçülen Yetkinlik': '-',
                    'Genel Değerlendirme': '-',
                    'Güçlü Yönler': '-',
                    'Gelişim Alanları': '-',
                    'Mülakat Soruları': '-',
                    'Neden Bu Sorular?': '-',
                    'Gelişim Planı': '-'
                });
            }
        }

        // Excel dosyası oluştur
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Raporlar');

        // Dosya adını oluştur
        const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `raporlar_${sanitizedCompanyName}_${timestamp}.xlsx`;
        
        // exports klasörünü oluştur
        const exportsDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }
        
        const filePath = path.join(exportsDir, fileName);

        // Excel dosyasını kaydet
        XLSX.writeFile(workbook, filePath);

        safeLog('log', `Excel dosyası oluşturuldu: ${filePath}`);
        return filePath;
    } catch (error) {
        safeLog('error', 'Excel export hatası', error);
        throw error;
    }
};

/**
 * Şirket raporlarını özet olarak gösterir
 */
const showSummary = async (companyId, companyName) => {
    try {
        const userCodes = await UserCode.find({ companyId });
        const games = await Game.find({ companyId });
        
        const completedCount = userCodes.filter(uc => uc.status === 'Tamamlandı').length;
        const expiredCount = userCodes.filter(uc => uc.status === 'Süresi Doldu').length;
        const pendingCount = userCodes.filter(uc => uc.status === 'Beklemede' || !uc.status).length;

        console.log('\n=== ŞİRKET RAPOR ÖZETİ ===');
        console.log(`Şirket: ${companyName}`);
        console.log(`Company ID: ${companyId}`);
        console.log(`Toplam Kullanıcı Kodu: ${userCodes.length}`);
        console.log(`Tamamlanan: ${completedCount}`);
        console.log(`Süresi Dolan: ${expiredCount}`);
        console.log(`Bekleyen: ${pendingCount}`);
        console.log(`Toplam Oyun Kaydı: ${games.length}`);
        console.log('========================\n');
    } catch (error) {
        safeLog('error', 'Özet gösterim hatası', error);
    }
};

// Ana fonksiyon
const main = async () => {
    const companyId = process.argv[2];
    const format = (process.argv[3] || 'excel').toLowerCase();

    if (!companyId) {
        console.error('Kullanım: node scripts/exportCompanyReports.js <companyId> [format]');
        console.error('Örnek: node scripts/exportCompanyReports.js 507f1f77bcf86cd799439011 excel');
        process.exit(1);
    }

    // MongoDB bağlantısı
    await connectDB();

    try {
        // Şirketi bul
        const company = await CompanyManagement.findById(companyId);
        if (!company) {
            safeLog('error', `Şirket bulunamadı: ${companyId}`);
            process.exit(1);
        }

        const companyName = company.firmName || 'Bilinmeyen Şirket';

        // Özet göster
        await showSummary(companyId, companyName);

        // Export işlemi
        if (format === 'excel') {
            const filePath = await exportToExcel(companyId, companyName);
            if (filePath) {
                console.log(`\n✅ Excel dosyası başarıyla oluşturuldu: ${filePath}`);
            } else {
                console.log('\n⚠️  Bu şirket için export edilecek veri bulunamadı.');
            }
        } else {
            safeLog('error', `Desteklenmeyen format: ${format}. Sadece 'excel' destekleniyor.`);
            process.exit(1);
        }
    } catch (error) {
        safeLog('error', 'Export işlemi hatası', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        safeLog('log', 'MongoDB bağlantısı kapatıldı');
    }
};

// Script çalıştırılıyorsa
if (require.main === module) {
    main();
}

module.exports = {
    exportToExcel,
    showSummary
};

