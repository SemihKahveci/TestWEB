const express = require('express');
const router = express.Router();
const {
    getAllAuthorizations,
    createAuthorization,
    updateAuthorization,
    deleteAuthorization,
    getAuthorizationById
} = require('../controllers/authorizationController');
const { authenticateAdmin } = require('../middleware/auth');

// Tüm yetkilendirmeleri getir (sayfalama ve arama ile)
router.get('/', authenticateAdmin, getAllAuthorizations);

// Yeni yetkilendirme ekle
router.post('/', authenticateAdmin, createAuthorization);

// Yetkilendirme güncelle
router.put('/:id', authenticateAdmin, updateAuthorization);

// Yetkilendirme sil
router.delete('/:id', authenticateAdmin, deleteAuthorization);

// Tek yetkilendirme getir
router.get('/:id', authenticateAdmin, getAuthorizationById);

module.exports = router;
