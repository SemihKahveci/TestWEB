const express = require('express');
const router = express.Router();
const {
    getAllOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById
} = require('../controllers/organizationController');
const { authenticateAdmin } = require('../middleware/auth');

// Tüm organizasyonları getir
router.get('/', authenticateAdmin, getAllOrganizations);

// Yeni organizasyon ekle
router.post('/', authenticateAdmin, createOrganization);

// Organizasyon güncelle
router.put('/:id', authenticateAdmin, updateOrganization);

// Organizasyon sil
router.delete('/:id', authenticateAdmin, deleteOrganization);

// Tek organizasyon getir
router.get('/:id', authenticateAdmin, getOrganizationById);

module.exports = router;
