const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/rbac');
const { authenticate } = require('../middleware/auth');
const { dataIsolation } = require('../middleware/dataIsolation');
const VoteController = require('../controllers/voteController');
const {
  validateVote,
  validateGetVotesForTarget,
  validateGetUserVotes,
  validateGetVoteSummary,
  validateGetVoteHistory,
  validateRemoveVote
} = require('../validators/voteValidator');

// Apply authentication and data isolation middleware to all routes
router.use(authenticate);
router.use(dataIsolation.companyDataAccess);

/**
 * @swagger
 * components:
 *   schemas:
 *     Vote:
 *       type: object
 *       properties:
 *         vote_id:
 *           type: integer
 *           description: The auto-generated ID of the vote
 *         target_type_id:
 *           type: integer
 *           description: The type of the target (1=question, 2=answer, 3=comment)
 *         target_id:
 *           type: integer
 *           description: The ID of the target (question_id, answer_id, or comment_id)
 *         user_id:
 *           type: integer
 *           description: The ID of the user who voted
 *         vote_type_id:
 *           type: integer
 *           description: The type of vote (1=upvote, 2=downvote, 3=favorite, 4=report)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the vote was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the vote was last updated
 *         vote_type_name:
 *           type: string
 *           description: The name of the vote type (e.g., 'upvote', 'downvote')
 *         vote_display_name:
 *           type: string
 *           description: The display name of the vote type (e.g., 'Upvote', 'Downvote')
 *         target_type_name:
 *           type: string
 *           description: The name of the target type (e.g., 'question', 'answer')
 * 
 *     VoteType:
 *       type: object
 *       properties:
 *         vote_type_id:
 *           type: integer
 *           description: The ID of the vote type
 *         name:
 *           type: string
 *           description: The internal name of the vote type (e.g., 'upvote')
 *         display_name:
 *           type: string
 *           description: The display name of the vote type (e.g., 'Upvote')
 *         description:
 *           type: string
 *           description: A description of what this vote type means
 *         score_impact:
 *           type: integer
 *           description: The impact of this vote on the target's score
 *         is_active:
 *           type: boolean
 *           description: Whether this vote type is currently active
 * 
 *     VoteSummary:
 *       type: object
 *       properties:
 *         totalScore:
 *           type: integer
 *           description: The total score of all votes
 *         upvote:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of upvotes
 *             displayName:
 *               type: string
 *               description: Display name for upvotes
 *             userCount:
 *               type: integer
 *               description: Number of users who upvoted
 *             users:
 *               type: array
 *               items:
 *                 type: string
 *               description: Emails of users who upvoted
 *         downvote:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of downvotes
 *             displayName:
 *               type: string
 *               description: Display name for downvotes
 *             userCount:
 *               type: integer
 *               description: Number of users who downvoted
 *             users:
 *               type: array
 *               items:
 *                 type: string
 *               description: Emails of users who downvoted
 *         favorite:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of favorites
 *             displayName:
 *               type: string
 *               description: Display name for favorites
 *             userCount:
 *               type: integer
 *               description: Number of users who favorited
 *             users:
 *               type: array
 *               items:
 *                 type: string
 *               description: Emails of users who favorited
 *         report:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of reports
 *             displayName:
 *               type: string
 *               description: Display name for reports
 *             userCount:
 *               type: integer
 *               description: Number of users who reported
 *             users:
 *               type: array
 *               items:
 *                 type: string
 *               description: Emails of users who reported
 */

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Question and answer voting system
 */

/**
 * @swagger
 * /api/votes/types:
 *   get:
 *     summary: Get all available vote types
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vote types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VoteType'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/types', checkPermission('vote:read'), VoteController.getVoteTypes);

/**
 * @swagger
 * /api/votes/targets:
 *   get:
 *     summary: Get all available vote targets
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vote targets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       target_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/targets', checkPermission('vote:read'), VoteController.getVoteTargets);

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Add or update a vote
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetTypeId
 *               - targetId
 *               - voteTypeId
 *             properties:
 *               targetTypeId:
 *                 type: integer
 *                 description: The type of the target (1=question, 2=answer, 3=comment)
 *               targetId:
 *                 type: integer
 *                 description: The ID of the target (question_id, answer_id, or comment_id)
 *               voteTypeId:
 *                 type: integer
 *                 description: The type of vote (1=upvote, 2=downvote, 3=favorite, 4=report)
 *     responses:
 *       201:
 *         description: Vote added or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Vote'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Target not found
 *       500:
 *         description: Server error
 */
router.post('/', checkPermission('vote:create'), validateVote, VoteController.addOrUpdateVote);

/**
 * @swagger
 * /api/votes/target/{targetTypeId}/{targetId}:
 *   get:
 *     summary: Get votes for a specific target
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetTypeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The type of the target (1=question, 2=answer, 3=comment)
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the target (question_id, answer_id, or comment_id)
 *       - in: query
 *         name: voteTypeId
 *         schema:
 *           type: integer
 *         description: Filter by vote type ID (1=upvote, 2=downvote, etc.)
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
 *         description: List of votes for the target
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vote'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/target/:targetTypeId/:targetId', checkPermission('vote:read'), validateGetVotesForTarget, VoteController.getVotesForTarget);

/**
 * @swagger
 * /api/votes/my-votes:
 *   get:
 *     summary: Get votes by the current user
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: voteTypeId
 *         schema:
 *           type: integer
 *         description: Filter by vote type ID (1=upvote, 2=downvote, etc.)
 *       - in: query
 *         name: targetTypeId
 *         schema:
 *           type: integer
 *         description: Filter by target type ID (1=question, 2=answer, 3=comment)
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
 *         description: List of votes by the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vote'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-votes', checkPermission('vote:read'), validateGetUserVotes, VoteController.getMyVotes);

/**
 * @swagger
 * /api/votes/summary/{targetTypeId}/{targetId}:
 *   get:
 *     summary: Get vote summary for a target
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetTypeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The type of the target (1=question, 2=answer, 3=comment)
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the target (question_id, answer_id, or comment_id)
 *     responses:
 *       200:
 *         description: Vote summary for the target
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VoteSummary'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary/:targetTypeId/:targetId', checkPermission('vote:read'), validateGetVoteSummary, VoteController.getVoteSummary);

/**
 * @swagger
 * /api/votes/history/{targetTypeId}/{targetId}:
 *   get:
 *     summary: Get vote history for a target
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetTypeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The type of the target (1=question, 2=answer, 3=comment)
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the target (question_id, answer_id, or comment_id)
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
 *         description: Vote history for the target
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       history_id:
 *                         type: integer
 *                       vote_id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       user_email:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       old_vote_type_name:
 *                         type: string
 *                       new_vote_type_name:
 *                         type: string
 *                       old_vote_display_name:
 *                         type: string
 *                       new_vote_display_name:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history/:targetTypeId/:targetId', checkPermission('vote:read'), validateGetVoteHistory, VoteController.getVoteHistory);

/**
 * @swagger
 * /api/votes/{voteId}:
 *   delete:
 *     summary: Remove a vote
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: voteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vote to remove
 *     responses:
 *       200:
 *         description: Vote removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the vote
 *       404:
 *         description: Vote not found
 *       500:
 *         description: Server error
 */
router.delete('/:voteId', checkPermission('vote:delete'), validateRemoveVote, VoteController.removeVote);

module.exports = router;
