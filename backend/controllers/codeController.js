const UserCode = require('../models/userCode');
const CodeValidationUtils = require('../utils/codeValidation');
const CommonUtils = require('../utils/commonUtils');
const errorMessages = require('../utils/errorMessages');


class CodeController {
    constructor(wss) {
        this.wss = wss;
        // Error messages artık merkezi sistemden geliyor
    }

    // Kod üretme
    async generateCode(req, res) {
        try {
            const { name, email, planet, allPlanets } = req.body;
            
            if (!name || !email || !planet) {
                return res.status(400).json(
                    errorMessages.create('Ad, e-posta ve gezegen bilgileri gereklidir')
                );
            }

            const code = await UserCode.generateUniqueCode();
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 72);

            const newCode = new UserCode({ 
                code,
                name,
                email,
                planet,
                allPlanets: allPlanets || [planet], // Eğer allPlanets yoksa sadece planet'i kullan
                status: 'Beklemede',
                sentDate: new Date(),
                expiryDate
            });
            
            await newCode.save();
            
            res.json(CommonUtils.createSuccessResponse('Kod başarıyla oluşturuldu', { code }));
        } catch (error) {
            console.error('Kod oluşturma hatası:', error);
            res.status(500).json(errorMessages.create('Kod oluşturulurken bir hata oluştu'));
        }
    }

    // Kodları listele
    async listCodes(req, res) {
        try {
            // Tüm kodları listele (kullanılmış ve kullanılmamış)
            const codes = await UserCode.find({})
                .sort({ createdAt: -1 });

            res.status(200).json(
                CommonUtils.createSuccessResponse('Kodlar başarıyla listelendi', { codes })
            );
        } catch (error) {
            console.error('Kodları listeleme hatası:', error);
            res.status(500).json(errorMessages.create('Kodları listeleme hatası'));
        }
    }

    // Kod doğrulama ve bölümleri getir
    async verifyGameCode(req, res) {
        try {
            // JSON verilerini kontrol et
            if (!CommonUtils.isValidObject(req.body)) {
                return res.status(400).json(
                    errorMessages.create('Geçersiz veri formatı. JSON verisi bekleniyor.')
                );
            }

            const { code } = req.body;
            if (!code) {
                return res.status(400).json(
                    errorMessages.create(errorMessages.get('codeRequired'))
                );
            }

            // Ortak doğrulama fonksiyonunu kullan
            const userCode = await CodeValidationUtils.validateCode(code);

            // Kodu kullanılmış olarak işaretle
            userCode.status = 'Oyun Devam Ediyor';
            userCode.isUsed = true;
            await userCode.save();

            const allPlanets = userCode.allPlanets || [userCode.planet];
            console.log(`Tüm seçilen gezegenler: ${allPlanets}`);
            
            const sectionNames = allPlanets.map(planet => CodeValidationUtils.planetToSection(planet));
            console.log(`Oluşturulan section'lar: ${sectionNames}`);

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı',
                sections: sectionNames.map(name => ({ name })),
                allPlanets: allPlanets
            });
        } catch (error) {
            console.error('Kod doğrulama hatası:', error);
            res.status(400).json(
                errorMessages.create(error.message || 'Kod doğrulama hatası')
            );
        }
    }

    // Kod geçerlilik süresini otomatik kontrol et
    async checkExpiredCodes() {
        try {
            const { earlyExpiryDate } = CodeValidationUtils.checkCodeExpiry(new Date());
            
            // Süresi dolmuş ama hala "Beklemede" veya "Oyun Devam Ediyor" durumunda olan kodları bul
            const expiredCodes = await UserCode.find({
                expiryDate: { $lt: earlyExpiryDate },
                status: { $in: ['Beklemede', 'Oyun Devam Ediyor'] }
            });

            // Bu kodları "Süresi Doldu" durumuna güncelle
            if (expiredCodes.length > 0) {
                await UserCode.updateMany(
                    {
                        expiryDate: { $lt: earlyExpiryDate },
                        status: { $in: ['Beklemede', 'Oyun Devam Ediyor'] }
                    },
                    {
                        $set: { status: 'Süresi Doldu' }
                    }
                );

                console.log(`${expiredCodes.length} adet kod süresi doldu ve güncellendi.`);
            }
        } catch (error) {
            console.error('Süresi dolan kodları kontrol etme hatası:', error);
        }
    }

    // Tüm kodları sil
    async deleteAllCodes(req, res) {
        try {
            await UserCode.deleteMany({});
            res.status(200).json({
                success: true,
                message: 'Tüm kodlar başarıyla silindi'
            });
        } catch (error) {
            console.error('Kodları silme hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
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
            console.error('Kod silme hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }

    // answerType1 değerlerine göre raporları getir ve değerlendirme sonuçlarını döndür
   
}

module.exports = CodeController; 