const { body, param, query } = require('express-validator');
const { db } = require('../db');

// Common validation rules
const commonRules = {
  reviewId: param('reviewId')
    .isInt({ min: 1 })
    .withMessage('Valid review ID is required')
    .toInt()
    .custom(async (value, { req }) => {
      // Check if review exists and user has access
      const review = await new Promise((resolve) => {
        db.get(
          `SELECT 1 FROM qb_reviews r
           JOIN qb_questions q ON r.question_id = q.question_id
           WHERE r.review_id = ? 
           AND (r.created_by = ? OR r.assigned_to = ? OR ? IN (
             SELECT user_id FROM base_employees WHERE company_id = q.company_id AND is_admin = 1
           ))`,
          [value, req.user.user_id, req.user.user_id, req.user.user_id],
          (err, row) => resolve(row)
        );
      });
      
      if (!review) {
        throw new Error('Review not found or access denied');
      }
      return true;
    }),
    
  questionId: body('questionId')
    .isInt({ min: 1 })
    .withMessage('Valid question ID is required')
    .toInt()
    .custom(async (value, { req }) => {
      // Check if question exists and belongs to user's company
      const question = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_questions q JOIN base_employees e ON q.company_id = e.company_id WHERE q.question_id = ? AND e.user_id = ?',
          [value, req.user.user_id],
          (err, row) => resolve(row)
        );
      });
      
      if (!question) {
        throw new Error('Question not found or access denied');
      }
      
      // Check if there's already an active review for this question
      const existingReview = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_reviews WHERE question_id = ? AND is_active = 1',
          [value],
          (err, row) => resolve(row)
        );
      });
      
      if (existingReview) {
        throw new Error('An active review already exists for this question');
      }
      
      return true;
    }),
    
  statusId: body('statusId')
    .isInt({ min: 1 })
    .withMessage('Valid status ID is required')
    .toInt()
    .custom(async (value) => {
      const status = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_review_status WHERE status_id = ? AND is_active = 1',
          [value],
          (err, row) => resolve(row)
        );
      });
      
      if (!status) {
        throw new Error('Invalid status ID');
      }
      return true;
    }),
    
  assignedTo: body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required for assignment')
    .toInt()
    .custom(async (value, { req }) => {
      // Check if user exists in the same company
      const user = await new Promise((resolve) => {
        db.get(
          `SELECT 1 FROM base_employees e1
           JOIN base_employees e2 ON e1.company_id = e2.company_id
           WHERE e1.user_id = ? AND e2.user_id = ?`,
          [value, req.user.user_id],
          (err, row) => resolve(row)
        );
      });
      
      if (!user) {
        throw new Error('User not found in your company');
      }
      return true;
    }),
    
  comment: body('comment')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
    
  notes: body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes cannot exceed 5000 characters'),
    
  priority: body('priority')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Priority must be between 1 (low) and 3 (high)')
    .toInt(),
    
  dueDate: body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (e.g., 2023-12-31T23:59:59Z)')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
    
  // Query params
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
    
  statusIdQuery: query('statusId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Status ID must be a positive integer')
    .toInt(),
    
  assignedToQuery: query('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
    
  createdByQuery: query('createdBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
    
  search: query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters')
};

// Validation rules for creating a review
const createReviewRules = [
  commonRules.questionId,
  commonRules.assignedTo.optional(),
  commonRules.notes,
  commonRules.priority,
  commonRules.dueDate
];

// Validation rules for getting a review
const getReviewRules = [
  commonRules.reviewId
];

// Validation rules for updating review status
const updateStatusRules = [
  commonRules.reviewId,
  commonRules.statusId,
  commonRules.comment.optional()
];

// Validation rules for adding a comment
const addCommentRules = [
  commonRules.reviewId,
  commonRules.comment
];

// Validation rules for assigning a review
const assignReviewRules = [
  commonRules.reviewId,
  body('userId')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required')
    .toInt()
];

// Validation rules for listing reviews
const listReviewsRules = [
  commonRules.statusIdQuery,
  commonRules.assignedToQuery,
  commonRules.createdByQuery,
  commonRules.search,
  commonRules.page,
  commonRules.limit
];

module.exports = {
  createReview: createReviewRules,
  getReview: getReviewRules,
  updateStatus: updateStatusRules,
  addComment: addCommentRules,
  assignReview: assignReviewRules,
  listReviews: listReviewsRules
};
