const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  totalCredits: {
    type: Number,
    required: true,
    default: 0
  },
  usedCredits: {
    type: Number,
    required: true,
    default: 0
  },
  remainingCredits: {
    type: Number,
    required: true,
    default: 0
  },
  transactions: [{
        type: {
          type: String,
          enum: ['game_send', 'credit_purchase', 'credit_refund', 'credit_restore'],
          required: true
        },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
creditSchema.index({ userId: 1 });

module.exports = mongoose.model('Credit', creditSchema);
