const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const QuestionStatusController = require('../controllers/questionStatusController');
const statusValidators = require('../validators/questionStatusValidator');
const { validateRequest } = require('../middleware/validateRequest');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @swagger
 * tags:
 *   name: Question Status
 *   description: Question status management
 */

/**
 * @swagger
 * /api/question-status:
 *   get:
 *     summary: Get all question statuses
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive statuses
 *     responses:
 *       200:
 *         description: List of question statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuestionStatus'
 */
router.get(
  '/',
  [
    ...statusValidators.includeInactive,
    ...statusValidators.pagination,
    validateRequest,
  ],
  QuestionStatusController.getAllStatuses
);

/**
 * @swagger
 * /api/question-status/{statusId}:
 *   get:
 *     summary: Get status by ID
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Status ID
 *     responses:
 *       200:
 *         description: Status details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionStatus'
 *       404:
 *         description: Status not found
 */
router.get(
  '/:statusId',
  [
    ...statusValidators.statusId,
    validateRequest,
  ],
  QuestionStatusController.getStatusById
);

/**
 * @swagger
 * /api/question-status:
 *   post:
 *     summary: Create a new status
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionStatus'
 *     responses:
 *       201:
 *         description: Status created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionStatus'
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  [
    authorize(['admin']), // Only admins can create statuses
    ...statusValidators.createStatus,
    validateRequest,
  ],
  QuestionStatusController.createStatus
);

/**
 * @swagger
 * /api/question-status/{statusId}:
 *   put:
 *     summary: Update a status
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Status ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuestionStatus'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionStatus'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Status not found
 */
router.put(
  '/:statusId',
  [
    authorize(['admin']), // Only admins can update statuses
    ...statusValidators.statusId,
    ...statusValidators.updateStatus,
    validateRequest,
  ],
  QuestionStatusController.updateStatus
);

/**
 * @swagger
 * /api/question-status/{statusId}:
 *   delete:
 *     summary: Delete a status
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Status ID
 *     responses:
 *       204:
 *         description: Status deleted successfully
 *       404:
 *         description: Status not found
 */
router.delete(
  '/:statusId',
  [
    authorize(['admin']), // Only admins can delete statuses
    ...statusValidators.statusId,
    validateRequest,
  ],
  QuestionStatusController.deleteStatus
);

/**
 * @swagger
 * /api/questions/{questionId}/status/history:
 *   get:
 *     summary: Get status history for a question
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Status history for the question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StatusHistory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get(
  '/questions/:questionId/status/history',
  [
    ...statusValidators.questionId,
    ...statusValidators.pagination,
    validateRequest,
  ],
  QuestionStatusController.getQuestionStatusHistory
);

/**
 * @swagger
 * /api/status/{statusId}/transitions:
 *   get:
 *     summary: Get valid status transitions for current user's role
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Current status ID
 *     responses:
 *       200:
 *         description: List of valid status transitions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StatusTransition'
 *       403:
 *         description: User role not specified or insufficient permissions
 */
router.get(
  '/status/:statusId/transitions',
  [
    ...statusValidators.statusId,
    validateRequest,
  ],
  QuestionStatusController.getValidTransitions
);

/**
 * @swagger
 * /api/questions/{questionId}/status:
 *   put:
 *     summary: Update question status
 *     tags: [Question Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_status_id
 *             properties:
 *               to_status_id:
 *                 type: integer
 *                 description: New status ID
 *               comments:
 *                 type: string
 *                 description: Optional comments about the status change
 *     responses:
 *       200:
 *         description: Question status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *                 history:
 *                   $ref: '#/components/schemas/StatusHistory'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Invalid status transition for user's role
 *       404:
 *         description: Question or status not found
 */
router.put(
  '/questions/:questionId/status',
  [
    ...statusValidators.questionId,
    ...statusValidators.updateQuestionStatus,
    validateRequest,
  ],
  QuestionStatusController.updateQuestionStatus
);

module.exports = router;
