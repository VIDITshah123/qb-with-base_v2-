const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const CompanyController = require('../controllers/companyController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules
const companyValidationRules = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('gstNumber').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GST number must be 15 characters'),
  body('city').optional().trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim().notEmpty().withMessage('State is required'),
  body('country').optional().trim().notEmpty().withMessage('Country is required'),
  body('pincode').optional().trim().isPostalCode('IN').withMessage('Invalid pincode'),
  body('address').optional().trim().notEmpty().withMessage('Address is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const idValidationRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid company ID')
];

// Get all companies (admin only)
router.get(
  '/',
  authorize('admin'),
  CompanyController.getAllCompanies
);

// Get companies owned by the current user
router.get(
  '/my-companies',
  CompanyController.getMyCompanies
);

// Get company by ID
router.get(
  '/:id',
  [...idValidationRule, validate],
  CompanyController.getCompanyById
);

// Create a new company
router.post(
  '/',
  [...companyValidationRules, validate],
  CompanyController.createCompany
);

// Update company
router.put(
  '/:id',
  [...idValidationRule, ...companyValidationRules, validate],
  CompanyController.updateCompany
);

// Delete company (soft delete)
router.delete(
  '/:id',
  [...idValidationRule, validate],
  CompanyController.deleteCompany
);

module.exports = router;
