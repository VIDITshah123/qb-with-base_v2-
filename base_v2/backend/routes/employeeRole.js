const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const EmployeeRoleController = require('../controllers/employeeRoleController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules
const roleAssignmentValidation = [
  body('roleId').isInt({ min: 1 }).withMessage('Valid role ID is required')
];

// Assign a role to an employee
router.post(
  '/company/:companyId/employee/:employeeId/roles',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
    param('employeeId').isInt({ min: 1 }).withMessage('Valid employee ID is required'),
    ...roleAssignmentValidation,
    validate
  ],
  EmployeeRoleController.assignRole
);

// Remove a role from an employee
router.delete(
  '/company/:companyId/roles/:employeeRoleId',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
    param('employeeRoleId').isInt({ min: 1 }).withMessage('Valid employee role ID is required'),
    validate
  ],
  EmployeeRoleController.removeRole
);

// Get all roles for an employee
router.get(
  '/company/:companyId/employee/:employeeId/roles',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
    param('employeeId').isInt({ min: 1 }).withMessage('Valid employee ID is required'),
    validate
  ],
  EmployeeRoleController.getEmployeeRoles
);

// Get all employees with their roles for a company
router.get(
  '/company/:companyId/employees/roles',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
    validate
  ],
  EmployeeRoleController.getCompanyEmployeesWithRoles
);

// Get all assignable roles for the current user in a company
router.get(
  '/company/:companyId/assignable-roles',
  [
    param('companyId').isInt({ min: 1 }).withMessage('Valid company ID is required'),
    validate
  ],
  EmployeeRoleController.getAssignableRoles
);

module.exports = router;
