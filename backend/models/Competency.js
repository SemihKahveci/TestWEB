const mongoose = require('mongoose');

const competencySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    customerFocus: {
        min: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        max: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        weight: {
            type: Number,
            default: 25,
            min: 0,
            max: 100
        }
    },
    uncertaintyManagement: {
        min: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        max: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        weight: {
            type: Number,
            default: 25,
            min: 0,
            max: 100
        }
    },
    influence: {
        min: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        max: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        weight: {
            type: Number,
            default: 25,
            min: 0,
            max: 100
        }
    },
    collaboration: {
        min: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        max: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        weight: {
            type: Number,
            default: 25,
            min: 0,
            max: 100
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyManagement',
        required: false, // Super admin için optional, normal admin için addCompanyIdToData ile otomatik eklenir
        index: true
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

// Min değerlerin max değerlerden küçük olmasını kontrol eden middleware
competencySchema.pre('save', function(next) {
    const competencies = ['customerFocus', 'uncertaintyManagement', 'influence', 'collaboration'];
    
    for (const comp of competencies) {
        if (this[comp].min > this[comp].max) {
            const error = new Error(`${comp} minimum değeri maksimum değerden büyük olamaz`);
            return next(error);
        }
    }

    let weightSum = 0;
    for (const comp of competencies) {
        const w = this[comp].weight;
        if (w !== undefined && w !== null && !Number.isNaN(Number(w))) {
            weightSum += Number(w);
        }
    }
    if (weightSum > 100) {
        const error = new Error('Yetkinlik ağırlıklarının toplamı 100\'ü geçemez');
        return next(error);
    }

    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Competency', competencySchema);
