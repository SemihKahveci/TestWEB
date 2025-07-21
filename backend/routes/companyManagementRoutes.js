const express = require('express');
const router = express.Router();
const companyManagementController = require('../controllers/companyManagementController');

// POST /api/company-management
router.post('/', companyManagementController.createCompany);
// GET /api/company-management
router.get('/', companyManagementController.getAllCompanies);

module.exports = router; 