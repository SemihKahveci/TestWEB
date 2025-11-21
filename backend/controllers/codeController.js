const UserCode = require('../models/userCode');
const Game = require('../models/game');
const EvaluationResult = require('../models/evaluationResult');
const Credit = require('../models/Credit');
const mongoose = require('mongoose');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');


class CodeController {
    constructor(wss) {
        this.wss = wss;
        this.errorMessages = {
            serverError: 'Sunucu hatası',
            invalidCode: 'Geçersiz kod',
            codeRequired: 'Kod gerekli',
            gameCompleted: 'Oyun zaten tamamlanmış',
            gameExpired: 'Oyun süresi dolmuş'
        };
    }

    // Kod üretme
    async generateCode(req, res) {
        try {
            const { name, email, planet, allPlanets } = req.body;
            
            if (!name || !email || !planet) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Ad, e-posta ve gezegen bilgileri gereklidir' 
                });
            }

            const code = await UserCode.generateUniqueCode();
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 72);

            // Multi-tenant: companyId otomatik eklenir
            const { addCompanyIdToData } = require('../middleware/auth');
            const codeData = addCompanyIdToData(req, {
                code,
                name,
                email,
                planet,
                allPlanets: allPlanets || [planet], // Eğer allPlanets yoksa sadece planet'i kullan
                status: 'Beklemede',
                sentDate: new Date(),
                expiryDate
            });
            
            // Normal admin için companyId kontrolü (super admin için optional)
            if (!codeData.companyId && req.admin && req.admin.role !== 'superadmin') {
                safeLog('error', 'Admin kod oluştururken companyId eksik', { adminId: req.admin._id });
                return res.status(400).json({ 
                    success: false, 
                    message: 'Admin companyId\'si bulunamadı. Lütfen admin hesabınızı kontrol edin.' 
                });
            }
            
            const newCode = new UserCode(codeData);
            
            await newCode.save();
            
            res.json({ success: true, code });
        } catch (error) {
            safeLog('error', 'Kod oluşturma hatası', error);
            res.status(500).json({ success: false, error: getSafeErrorMessage(error, 'Kod oluşturulurken bir hata oluştu') });
        }
    }

    // Kodları listele
    async listCodes(req, res) {
        try {
            // Multi-tenant: Super admin için tüm kodlar, normal admin için sadece kendi company'si
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            const codes = await UserCode.find(companyFilter)
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                codes,
                message: 'Kodlar başarıyla listelendi'
            });
        } catch (error) {
            safeLog('error', 'Kodları listeleme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, this.errorMessages.serverError)
            });
        }
    }

    // Kod doğrulama ve bölümleri getir
    async verifyGameCode(req, res) {
        try {
                  
            // JSON verilerini kontrol et
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz veri formatı. JSON verisi bekleniyor.'
                });
            }

            // Kodu al ve temizle
            let { code } = req.body;
            if (code && typeof code === 'string') {
                code = code.trimEnd(); // Sondaki boşluğu temizle
            }

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.codeRequired
                });
            }

            // Multi-tenant: Oyun oynayan kullanıcı için companyId kontrolü yapılmaz
            // Kod doğrulama için sadece kod kontrolü yeterli (güvenlik için)
            const userCode = await UserCode.findOne({ code });
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

            if (userCode.isUsed) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.gameCompleted
                });
            }

            userCode.status = 'Oyun Devam Ediyor';
            userCode.isUsed = true; // Kodu kullanılmış olarak işaretle
            await userCode.save();

            const allPlanets = userCode.allPlanets || [userCode.planet];
            safeLog('debug', 'Tüm seçilen gezegenler:', allPlanets);
            
            const sectionNames = allPlanets.map(planet => {
                if (planet === 'venus') {
                    safeLog('debug', 'Venus -> section 0');
                    return '0';
                } else if (planet === 'titan') {
                    safeLog('debug', 'Titan -> section 1');
                    return '1';
                } else {
                    safeLog('debug', `Bilinmeyen gezegen: '${planet}' -> varsayılan 0`);
                    return '0';
                }
            });
            
            safeLog('debug', 'Oluşturulan section\'lar:', sectionNames);

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı',
                sections: sectionNames.map(name => ({ name })),
                allPlanets: allPlanets
            });
        } catch (error) {
            safeLog('error', 'Kod doğrulama hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, this.errorMessages.serverError)
            });
        }
    }

    // Kod geçerlilik süresini otomatik kontrol et (71 saat sonra süresi dolmuş sayılır)
    async checkExpiredCodes() {
        try {
            const now = new Date();
            const earlyExpiryDate = new Date(now);
            earlyExpiryDate.setHours(earlyExpiryDate.getHours() - 1); // 1 saat önce süresi dolmuş sayılır
            
            // Süresi dolmuş ama hala "Beklemede" veya "Oyun Devam Ediyor" durumunda olan kodları bul
            const expiredCodes = await UserCode.find({
                expiryDate: { $lt: earlyExpiryDate },
                status: { $in: ['Beklemede', 'Oyun Devam Ediyor'] }
            });

            // Bu kodları "Süresi Doldu" durumuna güncelle ve kredi geri yükle
            if (expiredCodes.length > 0) {
                // Her kod için kredi geri yükleme işlemi
                for (const code of expiredCodes) {
                    try {
                        // Kredi miktarını hesapla (gezegen sayısı)
                        const planetCount = code.allPlanets ? code.allPlanets.length : 1;
                        
                        // Admin ID'yi bul - UserCode'dan companyId'yi al
                        const Admin = require('../models/Admin');
                        const admin = await Admin.findOne({ companyId: code.companyId });
                        
                        if (admin) {
                            // Kredi kaydını bul veya oluştur - companyId filtresi ile
                            const { getCompanyFilter } = require('../middleware/auth');
                            // Burada req yok, bu yüzden manuel filtre oluştur
                            const creditFilter = code.companyId ? { userId: admin._id, companyId: code.companyId } : { userId: admin._id };
                            let credit = await Credit.findOne(creditFilter);
                            
                            if (!credit) {
                                // Yeni kredi kaydı oluştur - companyId ekle
                                const creditData = code.companyId ? {
                                    userId: admin._id,
                                    companyId: code.companyId,
                                    totalCredits: 0,
                                    usedCredits: 0,
                                    remainingCredits: 0,
                                    transactions: []
                                } : {
                                    userId: admin._id,
                                    totalCredits: 0,
                                    usedCredits: 0,
                                    remainingCredits: 0,
                                    transactions: []
                                };
                                credit = new Credit(creditData);
                                await credit.save();
                            }
                            
                            // Kredi geri yükle
                            credit.usedCredits = Math.max(0, credit.usedCredits - planetCount);
                            credit.remainingCredits = credit.totalCredits - credit.usedCredits;
                            
                            // Transaction kaydı ekle
                            credit.transactions.push({
                                type: 'credit_restore',
                                amount: planetCount,
                                description: `Süresi dolan oyun için otomatik kredi geri yükleme: ${code.name} (${code.code})`,
                                timestamp: new Date()
                            });
                            
                            await credit.save();
                            safeLog('debug', `✅ ${code.name} için ${planetCount} kredi geri yüklendi`);
                        }
                    } catch (creditError) {
                        safeLog('error', `${code.name} için kredi geri yükleme hatası:`, creditError);
                    }
                }

                // Status'ları güncelle
                await UserCode.updateMany(
                    {
                        expiryDate: { $lt: earlyExpiryDate },
                        status: { $in: ['Beklemede', 'Oyun Devam Ediyor'] }
                    },
                    {
                        $set: { status: 'Süresi Doldu' }
                    }
                );

                safeLog('debug', `${expiredCodes.length} adet kod süresi doldu ve güncellendi.`);
            }
        } catch (error) {
            safeLog('error', 'Süresi dolan kodları kontrol etme hatası', error);
        }
    }

    // WebSocket üzerinden güncelleme gönder

    // Tüm kodları sil
    async deleteAllCodes(req, res) {
        try {
            await UserCode.deleteMany({});
            res.status(200).json({
                success: true,
                message: 'Tüm kodlar başarıyla silindi'
            });
        } catch (error) {
            safeLog('error', 'Kodları silme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, this.errorMessages.serverError)
            });
        }
    }

    // Tekli kod silme
    async deleteCode(req, res) {
        try {
            const { code } = req.body;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Kod gerekli'
                });
            }

            const result = await UserCode.deleteOne({ code });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Kod bulunamadı'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Kod başarıyla silindi'
            });
        } catch (error) {
            safeLog('error', 'Kod silme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, this.errorMessages.serverError)
            });
        }
    }

    // answerType1 değerlerine göre raporları getir ve değerlendirme sonuçlarını döndür
   
}

module.exports = CodeController; 