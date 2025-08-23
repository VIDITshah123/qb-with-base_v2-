const { body, param, query } = require('express-validator');
const Question = require('../models/question');

// Common validation rules
const commonRules = {
  questionText: body('questionText')
    .trim()
    .notEmpty().withMessage('Question text is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Question text must be between 10 and 5000 characters'),
    
  explanation: body('explanation')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Explanation cannot exceed 5000 characters'),

  questionType: body('type')
    .isIn(Object.values(Question.TYPES))
    .withMessage(`Invalid question type. Must be one of: ${Object.values(Question.TYPES).join(', ')}`),

  difficulty: body('difficulty')
    .isIn(Object.values(Question.DIFFICULTY))
    .withMessage(`Invalid difficulty. Must be one of: ${Object.values(Question.DIFFICULTY).join(', ')}`),

  status: body('status')
    .optional()
    .isIn(Object.values(Question.STATUS))
    .withMessage(`Invalid status. Must be one of: ${Object.values(Question.STATUS).join(', ')}`),

  options: body('options')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Options must be an array with at least one item'),

  optionText: body('options.*.text')
    .if(body('options').exists())
    .notEmpty()
    .withMessage('Option text is required')
    .isLength({ max: 2000 })
    .withMessage('Option text cannot exceed 2000 characters'),

  isCorrect: body('options.*.isCorrect')
    .if(body('options').exists())
    .isBoolean()
    .withMessage('isCorrect must be a boolean'),

  tagIds: body('tagIds')
    .optional()
    .isArray()
    .withMessage('tagIds must be an array'),

  tagId: body('tagIds.*')
    .if(body('tagIds').exists())
    .isInt({ min: 1 })
    .withMessage('Each tag ID must be a positive integer')
    .toInt(),

  categoryId: body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
    .toInt(),

  questionId: param('questionId')
    .isInt({ min: 1 })
    .withMessage('Valid question ID is required')
    .toInt(),

  versionNumber: param('versionNumber')
    .isInt({ min: 1 })
    .withMessage('Valid version number is required')
    .toInt(),

  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  search: query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term cannot exceed 255 characters'),

  format: query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be either json or csv')
};

// Validation rules for creating a question
const createQuestionRules = [
  commonRules.questionText,
  commonRules.explanation,
  commonRules.questionType,
  commonRules.difficulty,
  commonRules.options,
  commonRules.optionText,
  commonRules.isCorrect,
  commonRules.tagIds,
  commonRules.tagId,
  commonRules.categoryId
];

// Validation rules for updating a question
const updateQuestionRules = [
  commonRules.questionId,
  commonRules.questionText.optional(),
  commonRules.explanation,
  commonRules.questionType.optional(),
  commonRules.difficulty.optional(),
  commonRules.status,
  commonRules.options,
  commonRules.optionText,
  commonRules.isCorrect,
  commonRules.tagIds,
  commonRules.tagId,
  commonRules.categoryId
];

// Validation rules for getting a question
const getQuestionRules = [
  commonRules.questionId
];

// Validation rules for deleting a question
const deleteQuestionRules = [
  commonRules.questionId
];

// Validation rules for listing questions
const listQuestionsRules = [
  commonRules.page,
  commonRules.limit,
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
    .toInt(),
  query('type')
    .optional()
    .isIn(Object.values(Question.TYPES))
    .withMessage(`Type must be one of: ${Object.values(Question.TYPES).join(', ')}`),
  query('difficulty')
    .optional()
    .isIn(Object.values(Question.DIFFICULTY))
    .withMessage(`Difficulty must be one of: ${Object.values(Question.DIFFICULTY).join(', ')}`),
  query('status')
    .optional()
    .isIn(Object.values(Question.STATUS))
    .withMessage(`Status must be one of: ${Object.values(Question.STATUS).join(', ')}`),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
  query('tagIds')
    .optional()
    .custom((value) => {
      if (!Array.isArray(value)) {
        value = value.split(',');
      }
      return value.every(id => Number.isInteger(parseInt(id, 10)) && parseInt(id, 10) > 0);
    })
    .withMessage('Tag IDs must be a comma-separated list of positive integers')
    .toArray(),
  commonRules.search
];

// Validation rules for question versions
const getQuestionVersionsRules = [
  commonRules.questionId
];

const getQuestionVersionRules = [
  commonRules.questionId,
  commonRules.versionNumber
];

// Validation rules for exporting questions
const exportQuestionsRules = [
  commonRules.format,
  commonRules.page,
  commonRules.limit,
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
    .toInt(),
  query('type')
    .optional()
    .isIn(Object.values(Question.TYPES))
    .withMessage(`Type must be one of: ${Object.values(Question.TYPES).join(', ')}`),
  query('difficulty')
    .optional()
    .isIn(Object.values(Question.DIFFICULTY))
    .withMessage(`Difficulty must be one of: ${Object.values(Question.DIFFICULTY).join(', ')}`),
  query('status')
    .optional()
    .isIn(Object.values(Question.STATUS))
    .withMessage(`Status must be one of: ${Object.values(Question.STATUS).join(', ')}`)
];

// Custom validation for question type specific rules
const validateQuestionType = (req, res, next) => {
  const { type, options } = req.body;
  
  if (type && options) {
    switch (type) {
      case Question.TYPES.MULTIPLE_CHOICE:
        if (options.length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Multiple choice questions must have at least 2 options'
          });
        }
        const correctOptions = options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one option must be marked as correct'
          });
        }
        break;
        
      case Question.TYPES.TRUE_FALSE:
        if (options.length !== 2) {
          return res.status(400).json({
            success: false,
            message: 'True/False questions must have exactly 2 options (True and False)'
          });
        }
        break;
        
      case Question.TYPES.SHORT_ANSWER:
      case Question.TYPES.ESSAY:
        if (options && options.length > 0) {
          return res.status(400).json({
            success: false,
            message: `${type} questions should not have options`
          });
        }
        break;
        
      case Question.TYPES.MATCHING:
        if (options.length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Matching questions must have at least 2 pairs of options'
          });
        }
        // Add more specific validation for matching pairs if needed
        break;
        
      case Question.TYPES.FILL_BLANK:
        if (!req.body.questionText.includes('___')) {
          return res.status(400).json({
            success: false,
            message: 'Fill in the blank questions must contain at least one blank (___)'
          });
        }
        // Add more specific validation for fill-in-the-blank questions if needed
        break;
    }
  }
  
  next();
};

// Custom validation for question status transitions
const validateStatusTransition = (req, res, next) => {
  if (!req.body.status) return next();
  
  // Get the current question status from the database if it's an update
  if (req.method === 'PUT' && req.params.questionId) {
    Question.findById(req.params.questionId, req.user.company_id)
      .then(question => {
        if (!question) {
          return res.status(404).json({
            success: false,
            message: 'Question not found'
          });
        }
        
        const currentStatus = question.status;
        const newStatus = req.body.status;
        
        // Define allowed status transitions
        const allowedTransitions = {
          [Question.STATUS.DRAFT]: [Question.STATUS.PENDING_REVIEW, Question.STATUS.ARCHIVED],
          [Question.STATUS.PENDING_REVIEW]: [Question.STATUS.APPROVED, Question.STATUS.REJECTED, Question.STATUS.DRAFT],
          [Question.STATUS.APPROVED]: [Question.STATUS.ARCHIVED],
          [Question.STATUS.REJECTED]: [Question.STATUS.DRAFT, Question.STATUS.ARCHIVED],
          [Question.STATUS.ARCHIVED]: [Question.STATUS.DRAFT]
        };
        
        // Check if the transition is allowed
        if (currentStatus !== newStatus && 
            !allowedTransitions[currentStatus]?.includes(newStatus)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status transition from ${currentStatus} to ${newStatus}`
          });
        }
        
        next();
      })
      .catch(next);
  } else {
    next();
  }
};

module.exports = {
  createQuestion: [
    ...createQuestionRules,
    validateQuestionType,
    validateStatusTransition
  ],
  updateQuestion: [
    ...updateQuestionRules,
    validateQuestionType,
    validateStatusTransition
  ],
  getQuestion: getQuestionRules,
  deleteQuestion: deleteQuestionRules,
  listQuestions: listQuestionsRules,
  getQuestionVersions: getQuestionVersionsRules,
  getQuestionVersion: getQuestionVersionRules,
  exportQuestions: exportQuestionsRules,
  validateQuestionType,
  validateStatusTransition
};
