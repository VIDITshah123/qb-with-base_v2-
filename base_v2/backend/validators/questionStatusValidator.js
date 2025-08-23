const { body, param, query } = require('express-validator');
const QuestionStatus = require('../models/questionStatus');

const statusValidators = {
  // Status ID parameter validation
  statusId: [
    param('statusId')
      .isInt({ min: 1 })
      .withMessage('Status ID must be a positive integer')
      .custom(async (value) => {
        const status = await QuestionStatus.getById(value);
        if (!status) {
          throw new Error('Status not found');
        }
        return true;
      }),
  ],

  // Question ID parameter validation
  questionId: [
    param('questionId')
      .isInt({ min: 1 })
      .withMessage('Question ID must be a positive integer'),
  ],

  // Create status validation
  createStatus: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-z0-9_]+$/)
      .withMessage('Name can only contain lowercase letters, numbers, and underscores')
      .custom(async (value) => {
        const status = await QuestionStatus.getByName(value);
        if (status) {
          throw new Error('Status with this name already exists');
        }
        return true;
      }),
      
    body('display_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be between 2 and 100 characters'),
      
    body('description')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Description cannot exceed 255 characters'),
      
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean value'),
      
    body('is_default')
      .optional()
      .isBoolean()
      .withMessage('is_default must be a boolean value'),
  ],

  // Update status validation
  updateStatus: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-z0-9_]+$/)
      .withMessage('Name can only contain lowercase letters, numbers, and underscores')
      .custom(async (value, { req }) => {
        const status = await QuestionStatus.getByName(value);
        if (status && status.status_id !== parseInt(req.params.statusId)) {
          throw new Error('Status with this name already exists');
        }
        return true;
      }),
      
    body('display_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be between 2 and 100 characters'),
      
    body('description')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Description cannot exceed 255 characters'),
      
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean value'),
      
    body('is_default')
      .optional()
      .isBoolean()
      .withMessage('is_default must be a boolean value'),
  ],

  // Update question status validation
  updateQuestionStatus: [
    body('to_status_id')
      .isInt({ min: 1 })
      .withMessage('Status ID must be a positive integer')
      .custom(async (value, { req }) => {
        const status = await QuestionStatus.getById(value);
        if (!status) {
          throw new Error('Invalid status ID');
        }
        return true;
      }),
      
    body('comments')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comments cannot exceed 500 characters'),
  ],

  // Pagination query parameters
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
      
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // Include inactive query parameter
  includeInactive: [
    query('includeInactive')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('includeInactive must be either true or false')
      .toBoolean(),
  ],
};

module.exports = statusValidators;
