const Vote = require('../models/vote');
const { validationResult } = require('express-validator');

class VoteController {
  /**
   * Get all vote types
   * @route GET /api/votes/types
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getVoteTypes(req, res) {
    try {
      const voteTypes = await Vote.getVoteTypes();
      res.json({ success: true, data: voteTypes });
    } catch (error) {
      console.error('Error getting vote types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve vote types',
        error: error.message 
      });
    }
  }

  /**
   * Get all vote targets
   * @route GET /api/votes/targets
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getVoteTargets(req, res) {
    try {
      const targets = await Vote.getVoteTargets();
      res.json({ success: true, data: targets });
    } catch (error) {
      console.error('Error getting vote targets:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve vote targets',
        error: error.message 
      });
    }
  }

  /**
   * Add or update a vote
   * @route POST /api/votes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addOrUpdateVote(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { targetTypeId, targetId, voteTypeId } = req.body;
    const userId = req.user.user_id;

    try {
      const result = await Vote.addOrUpdateVote({
        targetTypeId,
        targetId,
        userId,
        voteTypeId
      });

      res.status(201).json({ 
        success: true, 
        message: `Vote ${result.action} successfully`,
        data: result.vote
      });
    } catch (error) {
      console.error('Error adding/updating vote:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process vote',
        error: error.message 
      });
    }
  }

  /**
   * Get votes for a specific target
   * @route GET /api/votes/target/:targetTypeId/:targetId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getVotesForTarget(req, res) {
    const { targetTypeId, targetId } = req.params;
    const { voteTypeId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
      const result = await Vote.getVotesForTarget(
        parseInt(targetTypeId), 
        parseInt(targetId), 
        { 
          voteTypeId: voteTypeId ? parseInt(voteTypeId) : undefined, 
          limit: parseInt(limit), 
          offset: parseInt(offset) 
        }
      );

      res.json({ 
        success: true, 
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting votes for target:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve votes',
        error: error.message 
      });
    }
  }

  /**
   * Get votes by the current user
   * @route GET /api/votes/my-votes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMyVotes(req, res) {
    const userId = req.user.user_id;
    const { voteTypeId, targetTypeId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
      const result = await Vote.getVotesByUser(
        userId, 
        { 
          voteTypeId: voteTypeId ? parseInt(voteTypeId) : undefined,
          targetTypeId: targetTypeId ? parseInt(targetTypeId) : undefined,
          limit: parseInt(limit), 
          offset: parseInt(offset) 
        }
      );

      res.json({ 
        success: true, 
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting user votes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve user votes',
        error: error.message 
      });
    }
  }

  /**
   * Get vote summary for a target
   * @route GET /api/votes/summary/:targetTypeId/:targetId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getVoteSummary(req, res) {
    const { targetTypeId, targetId } = req.params;

    try {
      const summary = await Vote.getVoteSummary(
        parseInt(targetTypeId), 
        parseInt(targetId)
      );

      // Check if the current user has voted
      const userVote = await Vote.getUserVote(
        parseInt(targetTypeId),
        parseInt(targetId),
        req.user.user_id
      );

      res.json({ 
        success: true, 
        data: {
          ...summary,
          userVote: userVote ? {
            voteTypeId: userVote.vote_type_id,
            voteTypeName: userVote.vote_type_name,
            voteDisplayName: userVote.vote_display_name,
            createdAt: userVote.created_at
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting vote summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve vote summary',
        error: error.message 
      });
    }
  }

  /**
   * Get vote history for a target
   * @route GET /api/votes/history/:targetTypeId/:targetId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getVoteHistory(req, res) {
    const { targetTypeId, targetId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
      const result = await Vote.getVoteHistory(
        parseInt(targetTypeId), 
        parseInt(targetId),
        { 
          limit: parseInt(limit), 
          offset: parseInt(offset) 
        }
      );

      res.json({ 
        success: true, 
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting vote history:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve vote history',
        error: error.message 
      });
    }
  }

  /**
   * Remove a vote
   * @route DELETE /api/votes/:voteId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async removeVote(req, res) {
    const { voteId } = req.params;
    const userId = req.user.user_id;

    try {
      // First get the vote to verify ownership
      const vote = await Vote.getVoteById(parseInt(voteId));
      
      if (!vote) {
        return res.status(404).json({ 
          success: false, 
          message: 'Vote not found' 
        });
      }

      // Check if the user owns this vote
      if (vote.user_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to delete this vote' 
        });
      }

      const success = await Vote.removeVote(parseInt(voteId));
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Vote removed successfully' 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Vote not found' 
        });
      }
    } catch (error) {
      console.error('Error removing vote:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to remove vote',
        error: error.message 
      });
    }
  }
}

module.exports = VoteController;
