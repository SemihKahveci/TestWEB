const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyManagement',
        required: function() {
            // Super admin için companyId zorunlu değil
            return this.role !== 'superadmin';
        }
    },
    company: {
        type: String,
        trim: true
        // Company name - display için kullanılır
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    titleOptions: {
        type: [String],
        default: [
            'Direktör',
            'Müdür/Yönetici',
            'Kıdemli Uzman',
            'Uzman',
            'Uzman Yardımcısı',
            'MT/Stajyer'
        ],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Şifre karşılaştırma metodu
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Şifre hashleme middleware
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Admin', adminSchema); 