const mongoose = require('mongoose');

const gameManagementSchema = new mongoose.Schema({
    firmName: {
        type: String,
        required: true,
        trim: true
    },
    invoiceNo: {
        type: String,
        required: true,
        trim: true
    },
    credit: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    invoiceFile: {
        fileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        fileData: {
            type: String, // Base64 encoded file data
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Güncelleme zamanını otomatik ayarla
gameManagementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('GameManagement', gameManagementSchema); 