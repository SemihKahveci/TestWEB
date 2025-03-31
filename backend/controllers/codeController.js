const UserCode = require('../models/userCode');

class CodeController {
    constructor() {
        this.errorMessages = {
            serverError: 'Sunucu hatası',
            invalidCode: 'Geçersiz kod',
            codeRequired: 'Kod gerekli'
        };
    }

    // Kod üretme
    async generateCode(req, res) {
        try {
            const code = Math.random().toString(36).substring(2, 15).toUpperCase();
            const newCode = new UserCode({
                code,
                isUsed: false,
                createdAt: new Date()
            });

            await newCode.save();
            console.log('Yeni kod oluşturuldu:', code);

            res.status(200).json({
                success: true,
                code,
                message: 'Yeni kod başarıyla oluşturuldu'
            });
        } catch (error) {
            console.error('Kod oluşturma hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Kod oluşturulurken bir hata oluştu: ' + error.message
            });
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

    // Kodu doğrula
    async verifyCode(req, res) {
        try {
            const { code } = req.body;
            console.log('Gelen kod:', code);

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.codeRequired
                });
            }

            const userCode = await UserCode.findOne({ code, isUsed: false });
            if (!userCode) {
                return res.status(400).json({
                    success: false,
                    message: this.errorMessages.invalidCode
                });
            }

            res.status(200).json({
                success: true,
                message: 'Kod doğrulandı'
            });
        } catch (error) {
            console.error('Kod doğrulama hatası:', error);
            res.status(500).json({
                success: false,
                message: this.errorMessages.serverError
            });
        }
    }
}

module.exports = CodeController; 