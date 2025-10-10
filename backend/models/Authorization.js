const mongoose = require('mongoose');

const authorizationSchema = new mongoose.Schema({
    sicilNo: {
        type: String,
        required: [true, 'Sicil numarası gereklidir'],
        trim: true,
        unique: true,
        maxlength: [20, 'Sicil numarası 20 karakterden fazla olamaz']
    },
    personName: {
        type: String,
        required: [true, 'Kişi adı gereklidir'],
        trim: true,
        maxlength: [100, 'Kişi adı 100 karakterden fazla olamaz']
    },
    title: {
        type: String,
        required: [true, 'Pozisyon gereklidir'],
        trim: true,
        maxlength: [100, 'Pozisyon 100 karakterden fazla olamaz']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false
    }
}, {
    timestamps: true
});

// Index'ler
authorizationSchema.index({ sicilNo: 1 });
authorizationSchema.index({ personName: 1 });
authorizationSchema.index({ title: 1 });

// Virtual field for formatted dates
authorizationSchema.virtual('formattedCreatedAt').get(function() {
    return this.createdAt.toLocaleDateString('tr-TR');
});

authorizationSchema.virtual('formattedUpdatedAt').get(function() {
    return this.updatedAt.toLocaleDateString('tr-TR');
});

module.exports = mongoose.model('Authorization', authorizationSchema);
