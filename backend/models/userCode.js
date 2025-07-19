const mongoose = require('mongoose');

const userCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    planet: {
        type: String,
        required: true
    },
    allPlanets: {
        type: [String],
        default: function() {
            return [this.planet]; // Varsayılan olarak sadece planet'i içer
        }
    },
    status: {
        type: String,
        enum: ['Beklemede', 'Oyun Devam Ediyor', 'Tamamlandı'],
        default: 'Beklemede'
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    sentDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    completionDate: {
        type: Date
    },
    evaluationResult: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    customerFocusScore: {
        type: String,
        default: '-'
    },
    uncertaintyScore: {
        type: String,
        default: '-'
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