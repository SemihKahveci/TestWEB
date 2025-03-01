const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionNumber: {
        type: String,
        required: true
    },
    answerType1: {
        type: String,
        required: true,
        enum: ['AKY', 'CY', 'Y', 'AY']
    },
    answerType2: {
        type: String,
        required: true,
        enum: ['AKY', 'CY', 'Y', 'AY']
    },
    answerValue1: {
        type: String,
        required: true
    },
    answerValue2: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        required: true
    }
});

const gameSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true
    },
    answers: [answerSchema],
    date: {
        type: Date,
        default: Date.now
    },
    totalScore: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Game', gameSchema); 