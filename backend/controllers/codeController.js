const UserCode = require('../models/userCode');

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
            const code = await UserCode.generateUniqueCode();
            const newCode = new UserCode({ code });
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
            console.log('Gelen istek body:', req.body);
            
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
            
            console.log('Gelen kod (temizlenmiş):', code);

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

            // Kodu kullanılmış olarak işaretleme işlemini kaldırdık
            // Bu işlem oyun sonuçları gönderildiğinde yapılacak

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı',
                sections: [
                    { name: '1' },
                    { name: '2' },
                    { name: '3' }
                ]
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
}

module.exports = CodeController; 