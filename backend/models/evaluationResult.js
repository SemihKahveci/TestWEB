const mongoose = require('mongoose');
 
const evaluationResultSchema = new mongoose.Schema({
    ID: {
        type: String,
        required: true,
        unique: true
    },
    'Yönetici özeti güçlü yönleri': {
        type: String
    },
    'Yönetici özeti geliştirme': {
        type: String
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