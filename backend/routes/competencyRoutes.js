const express = require('express');
const router = express.Router();
const competencyController = require('../controllers/competencyController');
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

// Tüm route'lar authentication gerektirir
router.use(authenticateAdmin);

// Yetkinlik CRUD işlemleri
router.get('/', competencyController.getCompetencies);
router.get('/:id', competencyController.getCompetencyById);
router.post('/', competencyController.createCompetency);
router.put('/:id', competencyController.updateCompetency);
router.delete('/:id', competencyController.deleteCompetency);

// Excel'den yetkinlik import etme
router.post('/import', upload.single('excelFile'), competencyController.importCompetencies);

module.exports = router;
