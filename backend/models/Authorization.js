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
    email: {
        type: String,
        required: [true, 'Email gereklidir'],
        trim: true,
        lowercase: true,
        maxlength: [100, 'Email 100 karakterden fazla olamaz'],
        match: [/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Geçerli bir email adresi giriniz']
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
authorizationSchema.index({ personName: 1 });
authorizationSchema.index({ email: 1 });
authorizationSchema.index({ title: 1 });

// Virtual field for formatted dates
authorizationSchema.virtual('formattedCreatedAt').get(function() {
    return this.createdAt.toLocaleDateString('tr-TR');
});

authorizationSchema.virtual('formattedUpdatedAt').get(function() {
    return this.updatedAt.toLocaleDateString('tr-TR');
});

module.exports = mongoose.model('Authorization', authorizationSchema);
