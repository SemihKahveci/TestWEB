const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');

// Yeni kod oluştur
router.post('/generate', codeController.generateCode);

// Kodu doğrula
router.post('/verify', codeController.verifyCode);

// Aktif kodları listele
router.get('/list', codeController.listActiveCodes);

module.exports = router; 