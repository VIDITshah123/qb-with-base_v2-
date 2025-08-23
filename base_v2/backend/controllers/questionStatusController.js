const { validationResult } = require('express-validator');
const QuestionStatus = require('../models/questionStatus');
const { handleError, NotFoundError, ForbiddenError } = require('../utils/errors');

class QuestionStatusController {
  /**
   * Get all question statuses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getAllStatuses(req, res, next) {
    try {
      const { includeInactive } = req.query;
      const statuses = await QuestionStatus.getAll({
        includeInactive: includeInactive === 'true',
      });
      res.json(statuses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get status by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getStatusById(req, res, next) {
    try {
      const { statusId } = req.params;
      const status = await QuestionStatus.getById(statusId);
      
      if (!status) {
        throw new NotFoundError('Status not found');
      }
      
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async createStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const status = await QuestionStatus.create(req.body);
      res.status(201).json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { statusId } = req.params;
      const status = await QuestionStatus.update(statusId, req.body);
      
      if (!status) {
        throw new NotFoundError('Status not found');
      }
      
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async deleteStatus(req, res, next) {
    try {
      const { statusId } = req.params;
      const deleted = await QuestionStatus.delete(statusId);
      
      if (!deleted) {
        throw new NotFoundError('Status not found');
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get status history for a question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getQuestionStatusHistory(req, res, next) {
    try {
      const { questionId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const history = await QuestionStatus.getHistory(questionId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get valid status transitions for current user's role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getValidTransitions(req, res, next) {
    try {
      const { statusId } = req.params;
      const { role_id } = req.user; // Assuming user role is attached to request by auth middleware

      if (!role_id) {
        throw new ForbiddenError('User role not specified');
      }

      const transitions = await QuestionStatus.getValidTransitions(statusId, role_id);
      res.json(transitions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update question status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async updateQuestionStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { questionId } = req.params;
      const { to_status_id, comments } = req.body;
      const { user_id, role_id } = req.user;

      // 1. Get current question status
      const question = await QuestionStatus.getQuestionWithStatus(questionId);
      if (!question) {
        throw new NotFoundError('Question not found');
      }

      // 2. Check if transition is valid for user's role
      const validTransitions = await QuestionStatus.getValidTransitions(
        question.status_id,
        role_id
      );

      const isValidTransition = validTransitions.some(
        (t) => t.to_status_id === to_status_id
      );

      if (!isValidTransition) {
        throw new ForbiddenError('Invalid status transition for your role');
      }

      // 3. Update question status
      await QuestionStatus.updateQuestionStatus(questionId, to_status_id);

      // 4. Record in history
      const history = await QuestionStatus.addHistory({
        question_id: questionId,
        from_status_id: question.status_id,
        to_status_id,
        changed_by: user_id,
        comments,
      });

      // 5. Get updated question with status
      const updatedQuestion = await QuestionStatus.getQuestionWithStatus(questionId);

      res.json({
        success: true,
        question: updatedQuestion,
        history,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = QuestionStatusController;
