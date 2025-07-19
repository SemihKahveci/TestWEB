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
        answerType1: { 
            type: String, 
            required: true,
            enum: ['AKY', 'CY', 'Y', 'AY'],
            message: 'answerType1 must be "AKY", "CY", "Y", or "AY"'
        },
        answerType2: { 
            type: String, 
            required: true,
            enum: ['AKY', 'CY', 'Y', 'AY'],
            message: 'answerType2 must be "AKY", "CY", "Y", or "AY"'
        },
        answerSubCategory: { 
            type: String, 
            required: true,
            enum: ['MO', 'BY', 'HI', 'TW'],
            message: 'answerSubCategory must be "MO", "BY", "HI", or "TW"'
        },
        reserved1: { type: String },
        reserved2: { type: String },
        reserved3: { type: String }
    }],
    totalScore: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    evaluationId: { type: String },
    dummyData: {
        id: { type: String },
        name: { type: String },
        status: { type: String },
        submissionDate: { type: Date },
        completionDate: { type: Date },
        validityDate: { type: Date },
        score: { type: Number },
        section: { type: String },
        playerCode: { type: String }
    },
    evaluationResult: {
        type: Object,
        default: null
    },
    customerFocusScore: {
        type: String,
        default: '-'
    },
    uncertaintyScore: {
        type: String,
        default: '-'
    },
    hiScore: {
        type: String,
        default: '-'
    },
    twScore: {
        type: String,
        default: '-'
    }
});

module.exports = mongoose.model('Game', gameSchema); 