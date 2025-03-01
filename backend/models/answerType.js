const mongoose = require('mongoose');

const answerTypeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['AKY', 'CY', 'Y']
    },
    description: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('AnswerType', answerTypeSchema); 