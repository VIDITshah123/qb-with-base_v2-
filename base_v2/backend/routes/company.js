const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
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

// Query parameter validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'active', 'inactive']).withMessage('Status must be one of: all, active, inactive'),
  query('sortBy').optional().isIn(['company_name', 'created_at', 'employee_count', 'is_active']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

// Get companies with pagination and filters (admin only)
router.get(
  '/',
  authorize('admin'),
  [...paginationValidation, validate],
  CompanyController.getCompaniesPaginated
);

// Get company statistics (admin only)
router.get(
  '/stats',
  authorize('admin'),
  CompanyController.getCompanyStats
);

// Get recent companies (admin only)
router.get(
  '/recent',
  authorize('admin'),
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validate
  ],
  CompanyController.getRecentCompanies
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

// Update company status (admin only)
router.patch(
  '/:id/status',
  [
    ...idValidationRule,
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    validate
  ],
  authorize('admin'),
  CompanyController.updateCompanyStatus
);

module.exports = router;
