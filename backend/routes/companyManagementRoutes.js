const express = require('express');
const router = express.Router();
const companyManagementController = require('../controllers/companyManagementController');

// POST /api/company-management
router.post('/', companyManagementController.createCompany);
// GET /api/company-management
router.get('/', companyManagementController.getAllCompanies);
// DELETE /api/company-management/:vkn
router.delete('/:vkn', companyManagementController.deleteCompany);
// PUT /api/company-management/:vkn
router.put('/:vkn', companyManagementController.updateCompany);

module.exports = router; 