const UserCode = require('../models/userCode');
const Game = require('../models/game');
const EvaluationResult = require('../models/evaluationResult');
const mongoose = require('mongoose');


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
            
            res.json({ success: true, code });
        } catch (error) {
            console.error('Kod oluşturma hatası:', error);
            res.status(500).json({ success: false, error: 'Kod oluşturulurken bir hata oluştu' });
        }
    }

    // Kodları listele
    async listCodes(req, res) {
        try {
            const codes = await UserCode.find({ isUsed: false })
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                codes,
                message: 'Kodlar başarıyla listelendi'
            });
        } catch (error) {
            console.error('Kodları listeleme hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
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

            const userCode = await UserCode.findOne({ code });
            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            if (userCode.isUsed) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.gameCompleted
                });
            }

            userCode.status = 'Oyun Devam Ediyor';
            await userCode.save();

            const allPlanets = userCode.allPlanets || [userCode.planet];
            console.log(`Tüm seçilen gezegenler: ${allPlanets}`);
            
            const sectionNames = allPlanets.map(planet => {
                if (planet === 'venus') {
                    console.log('Venus -> section 0');
                    return '0';
                } else if (planet === 'titan') {
                    console.log('Titan -> section 1');
                    return '1';
                } else {
                    console.log(`Bilinmeyen gezegen: '${planet}' -> varsayılan 0`);
                    return '0';
                }
            });
            
            console.log(`Oluşturulan section'lar: ${sectionNames}`);

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı',
                sections: sectionNames.map(name => ({ name })),
                allPlanets: allPlanets
            });
        } catch (error) {
            console.error('Kod doğrulama hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
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