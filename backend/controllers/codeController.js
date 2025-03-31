const UserCode = require('../models/userCode');

class CodeController {
    constructor(wss) {
        this.wss = wss;
        this.errorMessages = {
            serverError: 'Sunucu hatası',
            invalidCode: 'Geçersiz kod',
            codeRequired: 'Kod gerekli'
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

        // Kodu kullanılmış olarak işaretle
        userCode.isUsed = true;
        await userCode.save();

        res.status(200).json({
            success: true,
            message: 'Kod doğrulandı',
            sections: [
                { name: 'Bölüm 1' },
                { name: 'Bölüm 2' },
                { name: 'Bölüm 3' }
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

}

module.exports = CodeController; 