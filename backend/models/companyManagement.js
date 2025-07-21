const mongoose = require('mongoose');

const companyManagementSchema = new mongoose.Schema({
    vkn: {
        type: String,
        required: true
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
    }
});

module.exports = mongoose.model('CompanyManagement', companyManagementSchema); 