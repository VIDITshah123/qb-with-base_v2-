const db = require('../db');

class Review {
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.questionId - Question ID to review
   * @param {number} reviewData.createdBy - User ID of the creator
   * @param {number} [reviewData.assignedTo] - User ID of the assignee
   * @param {string} [reviewData.notes] - Initial notes
   * @param {number} [reviewData.priority=2] - Priority (1: Low, 2: Medium, 3: High)
   * @param {string} [reviewData.dueDate] - Due date in ISO format
   * @returns {Promise<Object>} Created review
   */
  static async create({ questionId, createdBy, assignedTo = null, notes = null, priority = 2, dueDate = null }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_reviews 
         (question_id, status_id, created_by, assigned_to, notes, priority, due_date)
         VALUES (?, 1, ?, ?, ?, ?, ?)`,
        [questionId, createdBy, assignedTo, notes, priority, dueDate],
        async function(err) {
          if (err) return reject(err);
          
          const review = await this.findById(this.lastID, createdBy);
          
          // Update question with the new review ID
          await db.run(
            'UPDATE qb_questions SET review_id = ? WHERE question_id = ?',
            [this.lastID, questionId]
          );
          
          // Log the initial status
          await this.logStatusChange(this.lastID, 1, createdBy, 'Review created');
          
          resolve(review);
        }.bind(this)
      );
    });
  }

  /**
   * Find review by ID
   * @param {number} reviewId - Review ID
   * @param {number} userId - User ID for access control
   * @returns {Promise<Object|null>} Review object or null if not found
   */
  static findById(reviewId, userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT r.*, 
                rs.name as status_name,
                q.question_text,
                q.question_type,
                q.difficulty,
                u1.user_email as created_by_email,
                u2.user_email as assigned_to_email,
                u3.user_email as updated_by_email
         FROM qb_reviews r
         JOIN qb_review_status rs ON r.status_id = rs.status_id
         JOIN qb_questions q ON r.question_id = q.question_id
         JOIN base_master_users u1 ON r.created_by = u1.user_id
         LEFT JOIN base_master_users u2 ON r.assigned_to = u2.user_id
         LEFT JOIN base_master_users u3 ON r.updated_by = u3.user_id
         WHERE r.review_id = ? 
         AND (r.created_by = ? OR r.assigned_to = ? OR ? IN (
           SELECT user_id FROM base_employees WHERE company_id = q.company_id AND is_admin = 1
         ))`,
        [reviewId, userId, userId, userId],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          // Get review history and comments
          Promise.all([
            this.getHistory(reviewId),
            this.getComments(reviewId),
            this.getAssignments(reviewId)
          ]).then(([history, comments, assignments]) => {
            resolve({
              ...row,
              history,
              comments,
              assignments
            });
          }).catch(reject);
        }
      );
    });
  }

  /**
   * Update review status
   * @param {number} reviewId - Review ID
   * @param {number} statusId - New status ID
   * @param {number} userId - User ID making the change
   * @param {string} [comment] - Optional comment for the status change
   * @returns {Promise<boolean>} True if updated successfully
   */
  static async updateStatus(reviewId, statusId, userId, comment = '') {
    // Verify status exists
    const status = await new Promise((resolve) => {
      db.get(
        'SELECT 1 FROM qb_review_status WHERE status_id = ?',
        [statusId],
        (err, row) => resolve(row)
      );
    });
    
    if (!status) {
      throw new Error('Invalid status ID');
    }
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_reviews 
         SET status_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE review_id = ?`,
        [statusId, userId, reviewId],
        async function(err) {
          if (err) return reject(err);
          
          if (this.changes > 0) {
            // Log the status change
            await this.logStatusChange(reviewId, statusId, userId, comment);
            
            // If approved, update question status
            if (statusId === 3) { // Approved
              const review = await this.findById(reviewId, userId);
              if (review) {
                await db.run(
                  `UPDATE qb_questions 
                   SET status = 'published', 
                       published_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP,
                       updated_by = ?
                   WHERE question_id = ?`,
                  [userId, review.question_id]
                );
              }
            }
          }
          
          resolve(this.changes > 0);
        }.bind(this)
      );
    });
  }

  /**
   * Add a comment to a review
   * @param {number} reviewId - Review ID
   * @param {number} userId - User ID adding the comment
   * @param {string} commentText - Comment text
   * @returns {Promise<Object>} Created comment
   */
  static addComment(reviewId, userId, commentText) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_review_comments 
         (review_id, user_id, comment_text) 
         VALUES (?, ?, ?)`,
        [reviewId, userId, commentText],
        function(err) {
          if (err) return reject(err);
          
          this.getComment(this.lastID).then(resolve).catch(reject);
        }.bind(this)
      );
    });
  }

  /**
   * Get a single comment by ID
   * @param {number} commentId - Comment ID
   * @returns {Promise<Object|null>} Comment or null if not found
   */
  static getComment(commentId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, u.user_email, u.first_name, u.last_name
         FROM qb_review_comments c
         JOIN base_master_users u ON c.user_id = u.user_id
         WHERE c.comment_id = ?`,
        [commentId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  /**
   * Get all comments for a review
   * @param {number} reviewId - Review ID
   * @returns {Promise<Array>} List of comments
   */
  static getComments(reviewId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, u.user_email, u.first_name, u.last_name,
                ur.role_name, ur.role_description
         FROM qb_review_comments c
         JOIN base_master_users u ON c.user_id = u.user_id
         LEFT JOIN base_user_roles ur ON u.role_id = ur.role_id
         WHERE c.review_id = ?
         ORDER BY c.created_at`,
        [reviewId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get review history
   * @param {number} reviewId - Review ID
   * @returns {Promise<Array>} List of history entries
   */
  static getHistory(reviewId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT h.*, u.user_email, u.first_name, u.last_name, s.name as status_name
         FROM qb_review_history h
         JOIN base_master_users u ON h.changed_by = u.user_id
         JOIN qb_review_status s ON h.status_id = s.status_id
         WHERE h.review_id = ?
         ORDER BY h.created_at`,
        [reviewId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get review assignments
   * @param {number} reviewId - Review ID
   * @returns {Promise<Array>} List of assignments
   */
  static getAssignments(reviewId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, u.user_email, u.first_name, u.last_name,
                ass.user_email as assigned_by_email,
                ass.first_name as assigned_by_first_name,
                ass.last_name as assigned_by_last_name
         FROM qb_review_assignments a
         JOIN base_master_users u ON a.user_id = u.user_id
         JOIN base_master_users ass ON a.assigned_by = ass.user_id
         WHERE a.review_id = ?
         ORDER BY a.assigned_at DESC`,
        [reviewId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Assign a review to a user
   * @param {number} reviewId - Review ID
   * @param {number} userId - User ID to assign to
   * @param {number} assignedBy - User ID of the assigner
   * @returns {Promise<boolean>} True if assigned successfully
   */
  static async assignReview(reviewId, userId, assignedBy) {
    // First, deactivate any existing active assignments
    await db.run(
      `UPDATE qb_review_assignments 
       SET is_active = 0 
       WHERE review_id = ? AND is_active = 1`,
      [reviewId]
    );

    // Create new assignment
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_review_assignments 
         (review_id, user_id, assigned_by) 
         VALUES (?, ?, ?)`,
        [reviewId, userId, assignedBy],
        async function(err) {
          if (err) return reject(err);
          
          // Update the review's assigned_to field
          await db.run(
            'UPDATE qb_reviews SET assigned_to = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE review_id = ?',
            [userId, assignedBy, reviewId]
          );
          
          // Log the assignment
          await this.logStatusChange(
            reviewId, 
            null, 
            assignedBy, 
            `Assigned to user ID: ${userId}`
          );
          
          resolve(this.changes > 0);
        }.bind(this)
      );
    });
  }

  /**
   * Log a status change
   * @private
   */
  static logStatusChange(reviewId, statusId, changedBy, comments = '') {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_review_history 
         (review_id, status_id, changed_by, comments) 
         VALUES (?, ?, ?, ?)`,
        [reviewId, statusId, changedBy, comments],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Find reviews with filters
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.statusId] - Filter by status ID
   * @param {number} [filters.assignedTo] - Filter by assigned user ID
   * @param {number} [filters.createdBy] - Filter by creator user ID
   * @param {number} [filters.companyId] - Filter by company ID
   * @param {string} [filters.search] - Search term
   * @param {number} [page=1] - Page number
   * @param {number} [limit=10] - Items per page
   * @returns {Promise<Object>} Paginated results
   */
  static find(filters = {}, page = 1, limit = 10) {
    return new Promise((resolve, reject) => {
      const conditions = ['r.is_active = 1'];
      const params = [];
      
      // Apply filters
      if (filters.statusId) {
        conditions.push('r.status_id = ?');
        params.push(filters.statusId);
      }
      
      if (filters.assignedTo) {
        conditions.push('r.assigned_to = ?');
        params.push(filters.assignedTo);
      }
      
      if (filters.createdBy) {
        conditions.push('r.created_by = ?');
        params.push(filters.createdBy);
      }
      
      if (filters.companyId) {
        conditions.push('q.company_id = ?');
        params.push(filters.companyId);
      }
      
      if (filters.search) {
        conditions.push('(q.question_text LIKE ? OR r.notes LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get total count
      db.get(
        `SELECT COUNT(*) as total 
         FROM qb_reviews r
         JOIN qb_questions q ON r.question_id = q.question_id
         ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}`,
        params,
        (err, countRow) => {
          if (err) return reject(err);
          
          const total = countRow ? countRow.total : 0;
          const totalPages = Math.ceil(total / limit);
          
          // Get paginated results
          db.all(
            `SELECT r.*, 
                    rs.name as status_name,
                    q.question_text,
                    q.question_type,
                    q.difficulty,
                    q.status as question_status,
                    u1.user_email as created_by_email,
                    u1.first_name as created_by_first_name,
                    u1.last_name as created_by_last_name,
                    u2.user_email as assigned_to_email,
                    u2.first_name as assigned_to_first_name,
                    u2.last_name as assigned_to_last_name,
                    c.name as category_name
             FROM qb_reviews r
             JOIN qb_review_status rs ON r.status_id = rs.status_id
             JOIN qb_questions q ON r.question_id = q.question_id
             JOIN base_master_users u1 ON r.created_by = u1.user_id
             LEFT JOIN base_master_users u2 ON r.assigned_to = u2.user_id
             LEFT JOIN qb_question_categories c ON q.category_id = c.category_id
             ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
             ORDER BY r.updated_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, rows) => {
              if (err) return reject(err);
              
              resolve({
                data: rows || [],
                pagination: {
                  total,
                  totalPages,
                  currentPage: page,
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

module.exports = Review;
