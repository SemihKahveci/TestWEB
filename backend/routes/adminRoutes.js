const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, isSuperAdmin } = require('../middleware/auth');
const evaluationController = require('../controllers/evaluationController');

// Admin girişi - Bu route authentication gerektirmez
router.post('/login', adminController.login);

router.post("/logout", (req, res) => {
    // Eğer ileride cookie’ye geçersek burada cookie'yi sileceğiz  
    // Şimdilik sadece başarılı dönüş yapıyoruz
    return res.json({ success: true, message: "Çıkış başarılı" });
});

// Excel export - Authentication gerektirmez
router.get('/export-excel/:code', adminController.exportExcel);

// Şirket raporlarını toplu export et (Excel) - Authentication gerektirir
router.get('/export-company-reports/:companyId', adminController.exportCompanyReports);

// Contact form e-postası gönder (authentication gerektirmez)
router.post('/send-contact-email', adminController.sendContactEmail);

// Diğer route'lar authentication gerektirir
router.use(authenticateAdmin);

// Süper admin kontrolü
router.get('/check-superadmin', (req, res) => {
    res.json({ isSuperAdmin: req.admin.role === 'superadmin' });
});

// Dashboard istatistikleri
router.get('/dashboard-stats', adminController.getDashboardStats);

// Yeni admin oluşturma (sadece superadmin)
router.post('/create', isSuperAdmin, adminController.createAdmin);

// Admin güncelleme (sadece superadmin)
router.put('/:id', isSuperAdmin, adminController.updateAdmin);

// Admin listesi (sadece superadmin)
router.get('/list', isSuperAdmin, adminController.getAdmins);

// Tekil admin getirme (sadece superadmin)
router.get('/:id', isSuperAdmin, adminController.getAdminById);

// Değerlendirme işlemleri
router.post('/evaluations', adminController.createEvaluation);
router.delete('/evaluations/:id', adminController.deleteEvaluation);

// PDF oluşturma ve gönderme
router.post('/generate-pdf', adminController.generateAndSendPDF);

// Kod gönderme
router.post('/send-code', adminController.sendCode);

// Oyun tamamlandığında e-posta gönder
router.post('/send-completion-email', adminController.sendCompletionEmail);

// PDF önizleme
router.get('/evaluation/:id/preview', evaluationController.previewPDF);

// PDF indirme
router.post('/evaluation/:id/pdf', evaluationController.generatePDF);

// Admin silme
router.delete('/:id', isSuperAdmin, adminController.deleteAdmin);

module.exports = router;