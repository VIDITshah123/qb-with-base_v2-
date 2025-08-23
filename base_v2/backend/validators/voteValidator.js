const { body, param, query } = require('express-validator');
const db = require('../../db');

// Common validation rules for vote type ID
const voteTypeValidation = param('voteTypeId')
  .isInt({ min: 1 })
  .withMessage('Vote type ID must be a positive integer')
  .custom(async (value) => {
    const row = await new Promise((resolve) => {
      db.get(
        'SELECT 1 FROM qb_vote_types WHERE vote_type_id = ? AND is_active = 1',
        [value],
        (err, row) => resolve(row)
      );
    });
    if (!row) {
      throw new Error('Invalid vote type ID');
    }
    return true;
  });

// Common validation rules for target type ID
const targetTypeValidation = param('targetTypeId')
  .isInt({ min: 1 })
  .withMessage('Target type ID must be a positive integer')
  .custom(async (value) => {
    const row = await new Promise((resolve) => {
      db.get(
        'SELECT 1 FROM qb_vote_targets WHERE target_id = ?',
        [value],
        (err, row) => resolve(row)
      );
    });
    if (!row) {
      throw new Error('Invalid target type ID');
    }
    return true;
  });

// Common validation rules for target ID
const targetIdValidation = param('targetId')
  .isInt({ min: 1 })
  .withMessage('Target ID must be a positive integer');

// Validation for creating/updating a vote
exports.validateVote = [
  body('targetTypeId')
    .isInt({ min: 1 })
    .withMessage('Target type ID is required and must be a positive integer')
    .custom(async (value) => {
      const row = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_vote_targets WHERE target_id = ?',
          [value],
          (err, row) => resolve(row)
        );
      });
      if (!row) {
        throw new Error('Invalid target type ID');
      }
      return true;
    }),
  
  body('targetId')
    .isInt({ min: 1 })
    .withMessage('Target ID is required and must be a positive integer')
    .custom(async (value, { req }) => {
      const { targetTypeId } = req.body;
      
      // Check if the target exists based on its type
      let tableName, idField;
      switch (parseInt(targetTypeId)) {
        case 1: // Question
          tableName = 'qb_questions';
          idField = 'question_id';
          break;
        case 2: // Answer
          tableName = 'qb_answers';
          idField = 'answer_id';
          break;
        case 3: // Comment
          tableName = 'qb_comments';
          idField = 'comment_id';
          break;
        default:
          throw new Error('Invalid target type');
      }
      
      const row = await new Promise((resolve) => {
        db.get(
          `SELECT 1 FROM ${tableName} WHERE ${idField} = ?`,
          [value],
          (err, row) => resolve(row)
        );
      });
      
      if (!row) {
        throw new Error(`${tableName.replace('qb_', '').slice(0, -1)} not found`);
      }
      
      return true;
    }),
    
  body('voteTypeId')
    .isInt({ min: 1 })
    .withMessage('Vote type ID is required and must be a positive integer')
    .custom(async (value) => {
      const row = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_vote_types WHERE vote_type_id = ? AND is_active = 1',
          [value],
          (err, row) => resolve(row)
        );
      });
      if (!row) {
        throw new Error('Invalid vote type ID');
      }
      return true;
    })
];

// Validation for getting votes by target
exports.validateGetVotesForTarget = [
  targetTypeValidation,
  targetIdValidation,
  query('voteTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Vote type ID must be a positive integer')
    .custom(async (value) => {
      const row = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_vote_types WHERE vote_type_id = ? AND is_active = 1',
          [value],
          (err, row) => resolve(row)
        );
      });
      if (!row) {
        throw new Error('Invalid vote type ID');
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

// Validation for getting user's votes
exports.validateGetUserVotes = [
  query('voteTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Vote type ID must be a positive integer')
    .custom(async (value) => {
      const row = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_vote_types WHERE vote_type_id = ? AND is_active = 1',
          [value],
          (err, row) => resolve(row)
        );
      });
      if (!row) {
        throw new Error('Invalid vote type ID');
      }
      return true;
    }),
  query('targetTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Target type ID must be a positive integer')
    .custom(async (value) => {
      const row = await new Promise((resolve) => {
        db.get(
          'SELECT 1 FROM qb_vote_targets WHERE target_id = ?',
          [value],
          (err, row) => resolve(row)
        );
      });
      if (!row) {
        throw new Error('Invalid target type ID');
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

// Validation for getting vote summary
exports.validateGetVoteSummary = [
  targetTypeValidation,
  targetIdValidation
];

// Validation for getting vote history
exports.validateGetVoteHistory = [
  targetTypeValidation,
  targetIdValidation,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

// Validation for removing a vote
exports.validateRemoveVote = [
  param('voteId')
    .isInt({ min: 1 })
    .withMessage('Vote ID must be a positive integer')
    .custom(async (value, { req }) => {
      const vote = await new Promise((resolve) => {
        db.get(
          'SELECT user_id FROM qb_votes WHERE vote_id = ?',
          [value],
          (err, row) => resolve(row)
        );
      });
      
      if (!vote) {
        throw new Error('Vote not found');
      }
      
      // Check if the user owns the vote or is an admin
      if (vote.user_id !== req.user.user_id && !req.user.is_admin) {
        throw new Error('Not authorized to delete this vote');
      }
      
      return true;
    })
];

// Validation for getting vote types
exports.validateGetVoteTypes = [];

// Validation for getting vote targets
exports.validateGetVoteTargets = [];
