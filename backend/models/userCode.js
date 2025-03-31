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
        default: Date.now
    }
});

// Kod oluşturma fonksiyonu
userCodeSchema.statics.generateUniqueCode = async function() {
    let isUnique = false;
    let code;

    while (!isUnique) {
        code = Math.random().toString(36).substring(2, 15).toUpperCase();
        
        // Kodun benzersiz olup olmadığını kontrol et
        const existingCode = await this.findOne({ code });
        if (!existingCode) {
            isUnique = true;
        }
    }

    return code;
};

module.exports = mongoose.model('UserCode', userCodeSchema); 