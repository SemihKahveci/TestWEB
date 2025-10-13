const express = require('express');
const router = express.Router();
const { getUserCredits, updateTotalCredits, deductCredits, restoreCredits, getCreditTransactions } = require('../controllers/creditController');
const { authenticateAdmin } = require('../middleware/auth');

// Get user's credit information
router.get('/', authenticateAdmin, getUserCredits);

// Update total credits (admin only)
router.post('/update-total', authenticateAdmin, updateTotalCredits);

// Deduct credits for game sending
router.post('/deduct', authenticateAdmin, deductCredits);

// Restore credits for expired games
router.post('/restore', authenticateAdmin, restoreCredits);

// Get credit transactions
router.get('/transactions', authenticateAdmin, getCreditTransactions);

module.exports = router;
