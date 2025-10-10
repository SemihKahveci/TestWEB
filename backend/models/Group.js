const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Grup adı gereklidir'],
        trim: true,
        maxlength: [200, 'Grup adı 200 karakterden fazla olamaz']
    },
    status: {
        type: String,
        enum: ['Aktif', 'Pasif'],
        default: 'Aktif'
    },
    organizations: [{
        type: String,
        required: true
    }],
    persons: [{
        type: String,
        required: true
    }],
    planets: [{
        type: String,
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
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
groupSchema.index({ name: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ isActive: 1 });

// Virtual field for formatted date
groupSchema.virtual('formattedCreatedAt').get(function() {
    return this.createdAt.toLocaleDateString('tr-TR');
});

// Virtual field for formatted updated date
groupSchema.virtual('formattedUpdatedAt').get(function() {
    return this.updatedAt.toLocaleDateString('tr-TR');
});

// Pre-save middleware
groupSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get active groups
groupSchema.statics.getActiveGroups = function() {
    return this.find({ isActive: true, status: 'Aktif' });
};

// Instance method to toggle status
groupSchema.methods.toggleStatus = function() {
    this.status = this.status === 'Aktif' ? 'Pasif' : 'Aktif';
    this.isActive = this.status === 'Aktif';
    return this.save();
};

module.exports = mongoose.model('Group', groupSchema);
