const express = require('express');
const router = express.Router();
const {
    getAllGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    toggleGroupStatus,
    getActiveGroups,
    getMatchingPersonsByOrganizations
} = require('../controllers/groupController');
const { authenticateAdmin } = require('../middleware/auth');

// Tüm grupları getir (sayfalama ve arama ile)
router.get('/', authenticateAdmin, getAllGroups);

// Aktif grupları getir
router.get('/active', authenticateAdmin, getActiveGroups);

// Yeni grup ekle
router.post('/', authenticateAdmin, createGroup);

// Grup güncelle
router.put('/:id', authenticateAdmin, updateGroup);

// Grup sil
router.delete('/:id', authenticateAdmin, deleteGroup);

// Grup durumunu değiştir
router.patch('/:id/toggle-status', authenticateAdmin, toggleGroupStatus);

// Organizasyonlara göre eşleşen kişileri getir
router.post('/matching-persons', authenticateAdmin, getMatchingPersonsByOrganizations);

// Tek grup getir
router.get('/:id', authenticateAdmin, getGroupById);

module.exports = router;
