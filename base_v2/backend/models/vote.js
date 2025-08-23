const db = require('../db');

class Vote {
  /**
   * Get all vote types
   * @returns {Promise<Array>} List of vote types
   */
  static getVoteTypes() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM qb_vote_types WHERE is_active = 1 ORDER BY vote_type_id',
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get vote targets
   * @returns {Promise<Array>} List of vote targets
   */
  static getVoteTargets() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM qb_vote_targets ORDER BY target_id',
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Add or update a vote
   * @param {Object} voteData - Vote data
   * @param {number} voteData.targetTypeId - Target type ID (question, answer, comment)
   * @param {number} voteData.targetId - ID of the target (question_id, answer_id, etc.)
   * @param {number} voteData.userId - User ID of the voter
   * @param {number} voteData.voteTypeId - Type of vote (upvote, downvote, etc.)
   * @returns {Promise<Object>} The created/updated vote
   */
  static async addOrUpdateVote({ targetTypeId, targetId, userId, voteTypeId }) {
    return new Promise((resolve, reject) => {
      // Store a reference to the class for use in callbacks
      const self = this;
      
      // First, check if the user already voted on this target
      db.get(
        'SELECT vote_id, vote_type_id FROM qb_votes WHERE target_type_id = ? AND target_id = ? AND user_id = ?',
        [targetTypeId, targetId, userId],
        async (err, existingVote) => {
          if (err) return reject(err);

          if (existingVote) {
            // If the vote type is the same, remove the vote (toggle)
            if (existingVote.vote_type_id === voteTypeId) {
              await self.removeVote(existingVote.vote_id);
              return resolve({ action: 'removed', vote: null });
            }

            // Otherwise, update the existing vote
            db.run(
              'UPDATE qb_votes SET vote_type_id = ?, updated_at = CURRENT_TIMESTAMP WHERE vote_id = ?',
              [voteTypeId, existingVote.vote_id],
              async function(updateErr) {
                if (updateErr) return reject(updateErr);
                try {
                  const vote = await self.getVoteById(existingVote.vote_id);
                  resolve({ action: 'updated', vote });
                } catch (error) {
                  reject(error);
                }
              }
            );
          } else {
            // Create a new vote
            db.run(
              `INSERT INTO qb_votes 
               (target_type_id, target_id, user_id, vote_type_id) 
               VALUES (?, ?, ?, ?)`,
              [targetTypeId, targetId, userId, voteTypeId],
              async function(insertErr) {
                if (insertErr) return reject(insertErr);
                try {
                  const vote = await self.getVoteById(this.lastID);
                  resolve({ action: 'added', vote });
                } catch (error) {
                  reject(error);
                }
              }
            );
          }
        }
      );
    });
  }

  /**
   * Remove a vote
   * @param {number} voteId - Vote ID to remove
   * @returns {Promise<boolean>} True if vote was removed
   */
  static removeVote(voteId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM qb_votes WHERE vote_id = ?',
        [voteId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Get vote by ID
   * @param {number} voteId - Vote ID
   * @returns {Promise<Object|null>} Vote object or null if not found
   */
  static getVoteById(voteId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT v.*, 
                vt.name as vote_type_name,
                vt.display_name as vote_display_name,
                vt.score_impact,
                t.name as target_type_name,
                u.user_email,
                u.first_name,
                u.last_name
         FROM qb_votes v
         JOIN qb_vote_types vt ON v.vote_type_id = vt.vote_type_id
         JOIN qb_vote_targets t ON v.target_type_id = t.target_id
         JOIN base_master_users u ON v.user_id = u.user_id
         WHERE v.vote_id = ?`,
        [voteId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  /**
   * Get votes for a specific target
   * @param {number} targetTypeId - Target type ID
   * @param {number} targetId - Target ID
   * @param {Object} [options] - Additional options
   * @param {number} [options.voteTypeId] - Filter by vote type
   * @param {number} [options.limit=100] - Maximum number of results
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Object>} Object containing votes and total count
   */
  static getVotesForTarget(targetTypeId, targetId, { voteTypeId, limit = 100, offset = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const conditions = ['v.target_type_id = ?', 'v.target_id = ?'];
      const params = [targetTypeId, targetId];

      if (voteTypeId) {
        conditions.push('v.vote_type_id = ?');
        params.push(voteTypeId);
      }

      // First, get the total count
      db.get(
        `SELECT COUNT(*) as total 
         FROM qb_votes v
         WHERE ${conditions.join(' AND ')}`,
        params,
        (countErr, countRow) => {
          if (countErr) return reject(countErr);

          const total = countRow ? countRow.total : 0;

          // Then get the paginated results
          db.all(
            `SELECT v.*, 
                    vt.name as vote_type_name,
                    vt.display_name as vote_display_name,
                    u.user_email,
                    u.first_name,
                    u.last_name
             FROM qb_votes v
             JOIN qb_vote_types vt ON v.vote_type_id = vt.vote_type_id
             JOIN base_master_users u ON v.user_id = u.user_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY v.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, rows) => {
              if (err) return reject(err);

              resolve({
                data: rows || [],
                pagination: {
                  total,
                  totalPages: Math.ceil(total / limit),
                  currentPage: Math.floor(offset / limit) + 1,
                  pageSize: limit
                }
              });
            }
          );
        }
      );
    });
  }

  /**
   * Get votes by a specific user
   * @param {number} userId - User ID
   * @param {Object} [options] - Additional options
   * @param {number} [options.voteTypeId] - Filter by vote type
   * @param {number} [options.targetTypeId] - Filter by target type
   * @param {number} [options.limit=100] - Maximum number of results
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Object>} Object containing votes and total count
   */
  static getVotesByUser(userId, { voteTypeId, targetTypeId, limit = 100, offset = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const conditions = ['v.user_id = ?'];
      const params = [userId];

      if (voteTypeId) {
        conditions.push('v.vote_type_id = ?');
        params.push(voteTypeId);
      }

      if (targetTypeId) {
        conditions.push('v.target_type_id = ?');
        params.push(targetTypeId);
      }

      // First, get the total count
      db.get(
        `SELECT COUNT(*) as total 
         FROM qb_votes v
         WHERE ${conditions.join(' AND ')}`,
        params,
        (countErr, countRow) => {
          if (countErr) return reject(countErr);

          const total = countRow ? countRow.total : 0;

          // Then get the paginated results
          db.all(
            `SELECT v.*, 
                    vt.name as vote_type_name,
                    vt.display_name as vote_display_name,
                    t.name as target_type_name,
                    CASE 
                      WHEN v.target_type_id = 1 THEN q.question_text
                      WHEN v.target_type_id = 2 THEN a.answer_text
                      WHEN v.target_type_id = 3 THEN c.comment_text
                      ELSE NULL
                    END as target_content
             FROM qb_votes v
             JOIN qb_vote_types vt ON v.vote_type_id = vt.vote_type_id
             JOIN qb_vote_targets t ON v.target_type_id = t.target_id
             LEFT JOIN qb_questions q ON v.target_type_id = 1 AND v.target_id = q.question_id
             LEFT JOIN qb_answers a ON v.target_type_id = 2 AND v.target_id = a.answer_id
             LEFT JOIN qb_comments c ON v.target_type_id = 3 AND v.target_id = c.comment_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY v.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, rows) => {
              if (err) return reject(err);

              resolve({
                data: rows || [],
                pagination: {
                  total,
                  totalPages: Math.ceil(total / limit),
                  currentPage: Math.floor(offset / limit) + 1,
                  pageSize: limit
                }
              });
            }
          );
        }
      );
    });
  }

  /**
   * Get vote summary for a target
   * @param {number} targetTypeId - Target type ID
   * @param {number} targetId - Target ID
   * @returns {Promise<Object>} Vote summary
   */
  static getVoteSummary(targetTypeId, targetId) {
    return new Promise((resolve, reject) => {
      // Get the basic vote counts by type
      db.all(
        `SELECT 
            vt.vote_type_id,
            vt.name as vote_type_name,
            vt.display_name as vote_display_name,
            COUNT(v.vote_id) as count,
            GROUP_CONCAT(u.user_id) as user_ids,
            GROUP_CONCAT(u.user_email) as user_emails
         FROM qb_vote_types vt
         LEFT JOIN qb_votes v ON vt.vote_type_id = v.vote_type_id 
             AND v.target_type_id = ? 
             AND v.target_id = ?
         LEFT JOIN base_master_users u ON v.user_id = u.user_id
         WHERE vt.is_active = 1
         GROUP BY vt.vote_type_id
         ORDER BY vt.vote_type_id`,
        [targetTypeId, targetId],
        (err, rows) => {
          if (err) return reject(err);

          // Calculate total score
          let totalScore = 0;
          const voteCounts = {};
          
          rows.forEach(row => {
            voteCounts[row.vote_type_name] = {
              count: row.count || 0,
              displayName: row.vote_display_name,
              userCount: row.user_ids ? row.user_ids.split(',').filter(Boolean).length : 0,
              users: row.user_emails ? row.user_emails.split(',').filter(Boolean) : []
            };
            
            // Calculate score impact
            const scoreImpact = parseInt(row.count || 0) * (parseInt(row.score_impact) || 0);
            totalScore += scoreImpact;
          });

          resolve({
            totalScore,
            ...voteCounts
          });
        }
      );
    });
  }

  /**
   * Get user's vote on a target
   * @param {number} targetTypeId - Target type ID
   * @param {number} targetId - Target ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User's vote or null if not found
   */
  static getUserVote(targetTypeId, targetId, userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT v.*, vt.name as vote_type_name, vt.display_name as vote_display_name
         FROM qb_votes v
         JOIN qb_vote_types vt ON v.vote_type_id = vt.vote_type_id
         WHERE v.target_type_id = ? 
           AND v.target_id = ? 
           AND v.user_id = ?`,
        [targetTypeId, targetId, userId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  /**
   * Get vote history for a target
   * @param {number} targetTypeId - Target type ID
   * @param {number} targetId - Target ID
   * @param {Object} [options] - Additional options
   * @param {number} [options.limit=100] - Maximum number of results
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Object>} Vote history with pagination
   */
  static getVoteHistory(targetTypeId, targetId, { limit = 100, offset = 0 } = {}) {
    return new Promise((resolve, reject) => {
      // First, get the total count
      db.get(
        `SELECT COUNT(*) as total 
         FROM qb_vote_history h
         JOIN qb_votes v ON h.vote_id = v.vote_id
         WHERE v.target_type_id = ? AND v.target_id = ?`,
        [targetTypeId, targetId],
        (countErr, countRow) => {
          if (countErr) return reject(countErr);

          const total = countRow ? countRow.total : 0;

          // Then get the paginated results
          db.all(
            `SELECT h.*, 
                    v.vote_type_id as new_vote_type_id,
                    v.user_id,
                    u.user_email,
                    u.first_name,
                    u.last_name,
                    vt_old.name as old_vote_type_name,
                    vt_new.name as new_vote_type_name,
                    vt_old.display_name as old_vote_display_name,
                    vt_new.display_name as new_vote_display_name
             FROM qb_vote_history h
             JOIN qb_votes v ON h.vote_id = v.vote_id
             JOIN base_master_users u ON h.user_id = u.user_id
             LEFT JOIN qb_vote_types vt_old ON h.vote_type_id = vt_old.vote_type_id
             LEFT JOIN qb_vote_types vt_new ON v.vote_type_id = vt_new.vote_type_id
             WHERE v.target_type_id = ? AND v.target_id = ?
             ORDER BY h.created_at DESC
             LIMIT ? OFFSET ?`,
            [targetTypeId, targetId, limit, offset],
            (err, rows) => {
              if (err) return reject(err);

              resolve({
                data: rows || [],
                pagination: {
                  total,
                  totalPages: Math.ceil(total / limit),
                  currentPage: Math.floor(offset / limit) + 1,
                  pageSize: limit
                }
              });
            }
          );
        }
      );
    });
  }
}

module.exports = Vote;
