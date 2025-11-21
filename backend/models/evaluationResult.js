const mongoose = require('mongoose');
 
const evaluationResultSchema = new mongoose.Schema({
    ID: {
        type: String,
        required: true,
        unique: true
    },
    'Genel Değerlendirme': {
        type: String
    },
    'Güçlü Yönler': {
        type: String
    },
    'Gelişim Alanları': {
        type: String
    },
    'Mülakat Soruları': {
        type: String
    },
    'Neden Bu Sorular?': {
        type: String
    },
    'Gelişim Önerileri -1': {
        type: String
    },
    'Gelişim Önerileri -2': {
        type: String
    },
    'Gelişim Önerileri - 3': {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyManagement',
        required: true,
        index: true
    }
});
 
module.exports = mongoose.model('EvaluationResult', evaluationResultSchema); 