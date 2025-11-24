const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false // Opsiyonel: Transaction geçmişi için kullanılabilir
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyManagement',
    required: true,
    unique: true // Her company için tek bir kredi kaydı olmalı (unique zaten index oluşturur)
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

// companyId için unique index zaten schema'da tanımlı (unique: true)

module.exports = mongoose.model('Credit', creditSchema);
