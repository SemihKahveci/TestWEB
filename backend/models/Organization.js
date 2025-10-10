const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    sicil: {
        type: String,
        required: true,
        trim: true
    },
    adSoyad: {
        type: String,
        required: true,
        trim: true
    },
    sirket: {
        type: String,
        required: true,
        trim: true
    },
    genelMudurYardimciligi: {
        type: String,
        required: true,
        trim: true
    },
    direktörlük: {
        type: String,
        required: true,
        trim: true
    },
    müdürlük: {
        type: String,
        required: true,
        trim: true
    },
    pozisyon: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Sicil numarasına göre unique index
organizationSchema.index({ sicil: 1 }, { unique: true });

module.exports = mongoose.model('Organization', organizationSchema);
