const express = require('express');
const router = express.Router();
const companyManagementController = require('../controllers/companyManagementController');
const { authenticateAdmin, isSuperAdmin } = require('../middleware/auth');

// Tüm route'lar authentication ve super admin kontrolü gerektirir
router.use(authenticateAdmin);
router.use(isSuperAdmin);

// POST /api/company-management
router.post('/', companyManagementController.createCompany);
// GET /api/company-management
router.get('/', companyManagementController.getAllCompanies);
// DELETE /api/company-management/:vkn
router.delete('/:vkn', companyManagementController.deleteCompany);
// PUT /api/company-management/:vkn
router.put('/:vkn', companyManagementController.updateCompany);

module.exports = router; 