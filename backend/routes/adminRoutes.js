const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.post('/evaluation', adminController.createEvaluation);
router.delete('/evaluation/:id', adminController.deleteEvaluation);

module.exports = router; 