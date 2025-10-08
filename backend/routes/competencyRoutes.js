const express = require('express');
const router = express.Router();
const competencyController = require('../controllers/competencyController');
const { authenticateAdmin } = require('../middleware/auth');

// Tüm route'lar authentication gerektirir
router.use(authenticateAdmin);

// Yetkinlik CRUD işlemleri
router.get('/', competencyController.getCompetencies);
router.get('/:id', competencyController.getCompetencyById);
router.post('/', competencyController.createCompetency);
router.put('/:id', competencyController.updateCompetency);
router.delete('/:id', competencyController.deleteCompetency);

module.exports = router;
