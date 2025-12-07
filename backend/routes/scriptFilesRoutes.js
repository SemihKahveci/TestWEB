const express = require('express');
const router = express.Router();
const scriptFilesController = require('../controllers/scriptFilesController');
const { authenticateAdmin, isSuperAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer konfigürasyonu - Memory storage kullan
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece Excel (.xlsx, .xls) veya CSV (.csv) dosyaları kabul edilir!'), false);
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit (app.js'deki body parser limiti ile uyumlu)
    }
});

// Tüm route'lar authentication ve superadmin gerektirir
router.use(authenticateAdmin);
router.use(isSuperAdmin);

// Script güncelleme (Güncelle butonu)
router.post('/update', upload.single('excelFile'), (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Dosya çok büyük. Maksimum 100MB dosya yükleyebilirsiniz.'
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
            message: 'Dosya yüklenemedi. Lütfen .csv formatında bir dosya seçin.'
        });
    }
    next();
}, scriptFilesController.updateScriptFile);

// ID'leri güncelleme (ID'leri Güncelle butonu)
router.post('/update-ids', upload.single('excelFile'), (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Dosya çok büyük. Maksimum 100MB dosya yükleyebilirsiniz.'
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
            message: 'Dosya yüklenemedi. Lütfen .csv formatında bir dosya seçin.'
        });
    }
    next();
}, scriptFilesController.updateIDsScriptFile);

module.exports = router;

