const Review = require('../models/review');
const { validationResult } = require('express-validator');

class ReviewController {
  /**
   * Create a new review
   * @route POST /api/reviews
   */
  static async createReview(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { questionId, assignedTo, notes, priority, dueDate } = req.body;
      
      // Check if there's already an active review for this question
      const existingReview = await new Promise((resolve) => {
        db.get(
          'SELECT review_id FROM qb_reviews WHERE question_id = ? AND is_active = 1',
          [questionId],
          (err, row) => resolve(row)
        );
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'An active review already exists for this question'
        });
      }

      const review = await Review.create({
        questionId,
        createdBy: req.user.user_id,
        assignedTo,
        notes,
        priority,
        dueDate
      });

      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get review by ID
   * @route GET /api/reviews/:reviewId
   */
  static async getReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const review = await Review.findById(reviewId, req.user.user_id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or access denied'
        });
      }

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update review status
   * @route PUT /api/reviews/:reviewId/status
   */
  static async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;
      const { statusId, comment } = req.body;

      const updated = await Review.updateStatus(
        reviewId,
        statusId,
        req.user.user_id,
        comment
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or update failed'
        });
      }

      const review = await Review.findById(reviewId, req.user.user_id);

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add comment to review
   * @route POST /api/reviews/:reviewId/comments
   */
  static async addComment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;
      const { comment } = req.body;

      const newComment = await Review.addComment(
        reviewId,
        req.user.user_id,
        comment
      );

      res.status(201).json({
        success: true,
        data: newComment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign review to user
   * @route POST /api/reviews/:reviewId/assign
   */
  static async assignReview(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;
      const { userId } = req.body;

      const assigned = await Review.assignReview(
        reviewId,
        userId,
        req.user.user_id
      );

      if (!assigned) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or assignment failed'
        });
      }

      const review = await Review.findById(reviewId, req.user.user_id);

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List reviews with filters
   * @route GET /api/reviews
   */
  static async listReviews(req, res, next) {
    try {
      const { 
        statusId, 
        assignedTo, 
        createdBy, 
        search, 
        page = 1, 
        limit = 10 
      } = req.query;

      const filters = {
        statusId: statusId ? parseInt(statusId) : undefined,
        assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
        createdBy: createdBy ? parseInt(createdBy) : undefined,
        companyId: req.user.company_id,
        search
      };

      const result = await Review.find(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get review statistics
   * @route GET /api/reviews/statistics
   */
  static async getStatistics(req, res, next) {
    try {
      const stats = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            (SELECT COUNT(*) FROM qb_reviews WHERE company_id = ?) as total_reviews,
            (SELECT COUNT(*) FROM qb_reviews WHERE status_id = 1 AND company_id = ?) as pending_reviews,
            (SELECT COUNT(*) FROM qb_reviews WHERE status_id = 2 AND company_id = ?) as in_progress_reviews,
            (SELECT COUNT(*) FROM qb_reviews WHERE status_id = 3 AND company_id = ?) as approved_reviews,
            (SELECT COUNT(*) FROM qb_reviews WHERE status_id = 4 AND company_id = ?) as rejected_reviews,
            (SELECT COUNT(DISTINCT assigned_to) FROM qb_reviews WHERE assigned_to IS NOT NULL AND company_id = ?) as reviewers_count,
            (SELECT AVG(julianday(updated_at) - julianday(created_at)) 
             FROM qb_reviews 
             WHERE status_id IN (3, 4) AND company_id = ?) as avg_days_to_resolution`,
          [
            req.user.company_id,
            req.user.company_id,
            req.user.company_id,
            req.user.company_id,
            req.user.company_id,
            req.user.company_id,
            req.user.company_id
          ],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get review statuses
   * @route GET /api/reviews/statuses
   */
  static async getStatuses(req, res, next) {
    try {
      const statuses = await new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM qb_review_status WHERE is_active = 1 ORDER BY status_id',
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });

      res.json({
        success: true,
        data: statuses
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
