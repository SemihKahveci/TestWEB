const UserCode = require('../models/userCode');

class CodeController {
    // Yeni kod oluştur
    async generateCode(req, res) {
        try {
            const code = await UserCode.generateUniqueCode();
            const userCode = new UserCode({ code });
            await userCode.save();

            res.status(200).json({
                success: true,
                code: code
            });
        } catch (error) {
            console.error('Kod oluşturma hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kod oluşturulurken bir hata oluştu'
            });
        }
    }

    // Kodu doğrula
    async verifyCode(req, res) {
        try {
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Kod gerekli'
                });
            }

            const userCode = await UserCode.findOne({ code, isUsed: false });

            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz veya kullanılmış kod'
                });
            }

            // Kodu kullanılmış olarak işaretle
            userCode.isUsed = true;
            await userCode.save();

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı'
            });
        } catch (error) {
            console.error('Kod doğrulama hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kod doğrulanırken bir hata oluştu'
            });
        }
    }

    // Aktif kodları listele (admin için)
    async listActiveCodes(req, res) {
        try {
            const codes = await UserCode.find({ isUsed: false })
                .select('code createdAt')
                .sort('-createdAt');

            res.status(200).json({
                success: true,
                codes: codes
            });
        } catch (error) {
            console.error('Kod listeleme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kodlar listelenirken bir hata oluştu'
            });
        }
    }
}

module.exports = new CodeController(); 