const mongoose = require('mongoose');

const userCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 24 * 60 * 60 // 24 saat sonra otomatik silinecek
    }
});

// Kod oluşturma fonksiyonu
userCodeSchema.statics.generateUniqueCode = async function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 6;
    let isUnique = false;
    let code;

    while (!isUnique) {
        code = '';
        for (let i = 0; i < codeLength; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Kodun benzersiz olup olmadığını kontrol et
        const existingCode = await this.findOne({ code });
        if (!existingCode) {
            isUnique = true;
        }
    }

    return code;
};

module.exports = mongoose.model('UserCode', userCodeSchema); 