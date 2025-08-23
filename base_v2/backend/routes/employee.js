const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const DataIsolation = require('../middleware/dataIsolation');
const EmployeeController = require('../controllers/employeeController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules
const employeeValidationRules = [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID is required')
];

const idValidationRules = [
  param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
  param('employeeId').optional().isInt({ min: 1 }).withMessage('Valid employee ID is required')
];

// Get all companies where the current user is an employee
router.get('/my-companies', EmployeeController.getMyCompanies);

// Get all employees for a company
router.get(
  '/company/:companyId',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'), 
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.employeeManagementAccess
  ],
  EmployeeController.getCompanyEmployees
);

// Get employee details
router.get(
  '/:employeeId/company/:companyId',
  [
    ...idValidationRules, 
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.employeeManagementAccess
  ],
  EmployeeController.getEmployee
);

// Add an employee to a company
router.post(
  '/company/:companyId',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
    ...employeeValidationRules,
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.employeeManagementAccess
  ],
  EmployeeController.addEmployee
);

// Remove an employee from a company
router.delete(
  '/:employeeId/company/:companyId',
  [
    ...idValidationRules, 
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.employeeManagementAccess
  ],
  EmployeeController.removeEmployee
);

module.exports = router;
