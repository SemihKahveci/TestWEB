const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin girişi
router.post('/login', adminController.login);

// Değerlendirme işlemleri
router.post('/evaluations', adminController.createEvaluation);
router.delete('/evaluations/:id', adminController.deleteEvaluation);

// PDF oluşturma ve gönderme
router.post('/generate-pdf', adminController.generateAndSendPDF);

// Kod gönderme
router.post('/send-code', adminController.sendCode);

module.exports = router; 