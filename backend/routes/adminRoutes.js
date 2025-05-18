const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, isSuperAdmin } = require('../middleware/auth');
const evaluationController = require('../controllers/evaluationController');

// Admin girişi - Bu route authentication gerektirmez
router.post('/login', adminController.login);

// Diğer route'lar authentication gerektirir
router.use(authenticateAdmin);

// Yeni admin oluşturma (sadece superadmin)
router.post('/create', isSuperAdmin, adminController.createAdmin);

// Admin güncelleme (sadece superadmin)
router.put('/:id', isSuperAdmin, adminController.updateAdmin);

// Admin listesi (sadece superadmin)
router.get('/list', isSuperAdmin, adminController.getAdmins);

// Değerlendirme işlemleri
router.post('/evaluations', adminController.createEvaluation);
router.delete('/evaluations/:id', adminController.deleteEvaluation);

// PDF oluşturma ve gönderme
router.post('/generate-pdf', adminController.generateAndSendPDF);

// Kod gönderme
router.post('/send-code', adminController.sendCode);

// PDF önizleme
router.get('/evaluation/:id/preview', evaluationController.previewPDF);

// PDF indirme
router.post('/evaluation/:id/pdf', evaluationController.generatePDF);

// Admin silme
router.delete('/:id', isSuperAdmin, adminController.deleteAdmin);

module.exports = router; 