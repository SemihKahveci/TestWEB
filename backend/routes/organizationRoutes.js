const express = require('express');
const router = express.Router();
const {
    getAllOrganizations,
    getTitleOptions,
    updateTitleOptions,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById,
    bulkCreateOrganizations
} = require('../controllers/organizationController');
const { authenticateAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer konfigürasyonu - Memory storage kullan
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece Excel dosyaları (.xlsx, .xls) kabul edilir!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Tüm organizasyonları getir
router.get('/', authenticateAdmin, getAllOrganizations);

// Excel'den organizasyon import etme
router.post('/import', authenticateAdmin, upload.single('excelFile'), (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Dosya çok büyük. Maksimum 5MB dosya yükleyebilirsiniz.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Dosya yükleme hatası: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
}, (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Dosya yüklenemedi. Lütfen .xlsx veya .xls formatında bir dosya seçin.'
        });
    }
    next();
}, bulkCreateOrganizations);

// Unvan seçenekleri
router.get('/title-options', authenticateAdmin, getTitleOptions);
router.put('/title-options', authenticateAdmin, updateTitleOptions);

// Yeni organizasyon ekle
router.post('/', authenticateAdmin, createOrganization);

// Organizasyon güncelle
router.put('/:id', authenticateAdmin, updateOrganization);

// Organizasyon sil
router.delete('/:id', authenticateAdmin, deleteOrganization);

// Tek organizasyon getir
router.get('/:id', authenticateAdmin, getOrganizationById);

module.exports = router;
