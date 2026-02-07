const mongoose = require('mongoose');

const companyManagementSchema = new mongoose.Schema({
    vkn: {
        type: String,
        required: true,
        unique: true
    },
    firmName: {
        type: String,
        required: true
    },
    firmMail: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Basit email regex
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: props => `${props.value} geçerli bir email adresi değil!`
        }
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
    }
});

module.exports = mongoose.model('CompanyManagement', companyManagementSchema); 