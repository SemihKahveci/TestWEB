const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    playerCode: { type: String, required: true },
    section: { type: String, required: true },
    answers: [{
        questionId: { type: String, required: true },
        planetName: { type: String, required: true },
        questionText: { type: String, required: true },
        selectedAnswer1: { type: String, required: true },
        selectedAnswer2: { type: String, required: true },
        answerType1: { type: String, required: true },
        answerType2: { type: String, required: true },
        answerSubCategory: { 
            type: String, 
            required: true,
            enum: ['MO', 'BY'],
            message: 'answerSubCategory could be  "MO" or "BY"'
        },
        reserved1: { type: String },
        reserved2: { type: String },
        reserved3: { type: String }
    }],
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema); 