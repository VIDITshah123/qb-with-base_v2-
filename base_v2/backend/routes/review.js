const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/rbac');
const { authenticate } = require('../middleware/auth');
const { dataIsolation } = require('../middleware/dataIsolation');
const ReviewController = require('../controllers/reviewController');
const {
  createReview,
  getReview,
  updateStatus,
  addComment,
  assignReview,
  listReviews
} = require('../validators/reviewValidator');

// Apply authentication and data isolation middleware to all routes
router.use(authenticate);
router.use(dataIsolation.companyDataAccess);

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Question review management
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *             properties:
 *               questionId:
 *                 type: integer
 *                 description: ID of the question to review
 *               assignedTo:
 *                 type: integer
 *                 description: ID of the user to assign the review to
 *               notes:
 *                 type: string
 *                 description: Initial review notes
 *               priority:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: Review priority (1: Low, 2: Medium, 3: High)
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for the review
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Question not found
 */
router.post('/', checkPermission('review:create'), createReview, ReviewController.createReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the review to get
 *     responses:
 *       200:
 *         description: Review details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Review not found
 */
router.get('/:reviewId', checkPermission('review:read'), getReview, ReviewController.getReview);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: List reviews with filters
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statusId
 *         schema:
 *           type: integer
 *         description: Filter by status ID
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for question text or review notes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 *       401:
 *         description: Unauthorized
 */
router.get('/', checkPermission('review:read'), listReviews, ReviewController.listReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}/status:
 *   put:
 *     summary: Update review status
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statusId
 *             properties:
 *               statusId:
 *                 type: integer
 *                 description: New status ID
 *               comment:
 *                 type: string
 *                 description: Optional comment about the status change
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Review not found
 */
router.put('/:reviewId/status', checkPermission('review:update'), updateStatus, ReviewController.updateStatus);

/**
 * @swagger
 * /api/reviews/{reviewId}/comments:
 *   post:
 *     summary: Add a comment to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the review to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: The comment text
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Review not found
 */
router.post('/:reviewId/comments', checkPermission('review:comment'), addComment, ReviewController.addComment);

/**
 * @swagger
 * /api/reviews/{reviewId}/assign:
 *   post:
 *     summary: Assign a review to a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the review to assign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to assign the review to
 *     responses:
 *       200:
 *         description: Review assigned successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Review or user not found
 */
router.post('/:reviewId/assign', checkPermission('review:assign'), assignReview, ReviewController.assignReview);

/**
 * @swagger
 * /api/reviews/statuses:
 *   get:
 *     summary: Get available review statuses
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available statuses
 *       401:
 *         description: Unauthorized
 */
router.get('/statuses', checkPermission('review:read'), ReviewController.getStatuses);

/**
 * @swagger
 * /api/reviews/statistics:
 *   get:
 *     summary: Get review statistics
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', checkPermission('review:read'), ReviewController.getStatistics);

module.exports = router;
