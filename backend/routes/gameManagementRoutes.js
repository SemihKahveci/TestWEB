const express = require('express');
const router = express.Router();
const gameManagementController = require('../controllers/gameManagementController');

// Tüm oyun verilerini getir
router.get('/games', gameManagementController.getAllGames);

// Firma adına göre oyun verisi getir (spesifik route önce gelmeli)
router.get('/games/firm/:firmName', gameManagementController.getGameByFirmName);

// ID'ye göre oyun verisi getir
router.get('/games/:id', gameManagementController.getGameById);

// Yeni oyun verisi ekle
router.post('/games', gameManagementController.addGame);

// Oyun verisini güncelle
router.put('/games/:id', gameManagementController.updateGame);

// Oyun verisini sil
router.delete('/games/:id', gameManagementController.deleteGame);

module.exports = router; 