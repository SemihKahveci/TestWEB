const mongoose = require('mongoose');

const evaluationResultSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    generalEvaluation: {
        type: String,
        required: true
    },
    strengths: [{
        title: String,
        description: String
    }],
    development: [{
        title: String,
        description: String
    }],
    interviewQuestions: [{
        category: String,
        questions: [{
            mainQuestion: String,
            followUpQuestions: [String]
        }]
    }],
    developmentSuggestions: [{
        title: String,
        area: String,
        target: String,
        suggestions: [{
            title: String,
            content: String
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EvaluationResult', evaluationResultSchema); 