const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
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
    grupLiderligi: {
        type: String,
        required: true,
        trim: true
    },
    unvan: {
        type: String,
        required: true,
        trim: true
    },
    pozisyon: {
        type: String,
        required: true,
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyManagement',
        required: false, // Super admin için optional, normal admin için addCompanyIdToData ile otomatik eklenir
        index: true
    }
}, {
    timestamps: true
});

// Index'ler
organizationSchema.index({ genelMudurYardimciligi: 1 });
organizationSchema.index({ direktörlük: 1 });
organizationSchema.index({ müdürlük: 1 });
organizationSchema.index({ grupLiderligi: 1 });
organizationSchema.index({ unvan: 1 });
organizationSchema.index({ pozisyon: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
