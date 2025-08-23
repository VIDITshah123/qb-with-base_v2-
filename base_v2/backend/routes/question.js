const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const DataIsolation = require('../middleware/dataIsolation');
const QuestionController = require('../controllers/questionController');
const upload = require('../middleware/upload');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules
const questionIdParam = param('questionId')
  .isInt({ min: 1 })
  .withMessage('Valid question ID is required')
  .toInt();

const versionNumberParam = param('versionNumber')
  .isInt({ min: 1 })
  .withMessage('Valid version number is required')
  .toInt();

// Create a new question
router.post(
  '/',
  [
    body('type').notEmpty().withMessage('Question type is required'),
    body('difficulty').notEmpty().withMessage('Difficulty level is required'),
    body('questionText').notEmpty().withMessage('Question text is required'),
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.questionManagementAccess
  ],
  QuestionController.createQuestion
);

// Get question by ID
router.get(
  '/:questionId',
  [
    questionIdParam,
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.questionAccess
  ],
  QuestionController.getQuestion
);

// Update a question
router.put(
  '/:questionId',
  [
    questionIdParam,
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.questionManagementAccess
  ],
  QuestionController.updateQuestion
);

// Delete a question (soft delete)
router.delete(
  '/:questionId',
  [
    questionIdParam,
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.questionManagementAccess
  ],
  QuestionController.deleteQuestion
);

// List questions with filtering and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('categoryId').optional().isInt({ min: 1 }).toInt(),
    query('type').optional().isString(),
    query('difficulty').optional().isString(),
    query('status').optional().isString(),
    query('userId').optional().isInt({ min: 1 }).toInt(),
    query('tagIds').optional().isArray(),
    query('tagIds.*').optional().isInt({ min: 1 }).toInt(),
    query('search').optional().trim(),
    validate,
    DataIsolation.companyDataAccess
  ],
  QuestionController.listQuestions
);

// Get question versions
router.get(
  '/:questionId/versions',
  [
    questionIdParam,
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.questionAccess
  ],
  QuestionController.getQuestionVersions
);

// Get specific version of a question
router.get(
  '/:questionId/versions/:versionNumber',
  [
    questionIdParam,
    versionNumberParam,
    validate,
    DataIsolation.companyDataAccess,
    DataIsolation.questionAccess
  ],
  QuestionController.getQuestionVersion
);

// Get question statistics
router.get(
  '/statistics',
  [
    DataIsolation.companyDataAccess
  ],
  QuestionController.getStatistics
);

// Import questions from file
router.post(
  '/import',
  [
    upload.single('file'),
    DataIsolation.companyDataAccess,
    DataIsolation.questionManagementAccess
  ],
  QuestionController.importQuestions
);

// Export questions
router.get(
  '/export',
  [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    query('categoryId').optional().isInt({ min: 1 }).toInt(),
    query('type').optional().isString(),
    query('difficulty').optional().isString(),
    query('status').optional().isString(),
    validate,
    DataIsolation.companyDataAccess
  ],
  QuestionController.exportQuestions
);

module.exports = router;
