const db = require('../config/database');

class QuestionStatus {
  /**
   * Get all question statuses
   * @param {Object} options - Query options
   * @param {boolean} [options.includeInactive=false] - Include inactive statuses
   * @returns {Promise<Array>} List of statuses
   */
  static getAll({ includeInactive = false } = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM qb_question_statuses';
      const params = [];

      if (!includeInactive) {
        query += ' WHERE is_active = ?';
        params.push(1);
      }

      query += ' ORDER BY status_id';

      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Get status by ID
   * @param {number} statusId - Status ID
   * @returns {Promise<Object|null>} Status object or null if not found
   */
  static getById(statusId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM qb_question_statuses WHERE status_id = ?',
        [statusId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  /**
   * Get status by name
   * @param {string} name - Status name
   * @returns {Promise<Object|null>} Status object or null if not found
   */
  static getByName(name) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM qb_question_statuses WHERE name = ?',
        [name],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  /**
   * Create a new status
   * @param {Object} statusData - Status data
   * @returns {Promise<Object>} Created status
   */
  static create(statusData) {
    return new Promise((resolve, reject) => {
      const { name, display_name, description, is_active = true, is_default = false } = statusData;
      
      db.run(
        `INSERT INTO qb_question_statuses 
         (name, display_name, description, is_active, is_default) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, display_name, description, is_active ? 1 : 0, is_default ? 1 : 0],
        function(err) {
          if (err) return reject(err);
          this.getById(this.lastID)
            .then(status => resolve(status))
            .catch(reject);
        }.bind(this)
      );
    });
  }

  /**
   * Update a status
   * @param {number} statusId - Status ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated status
   */
  static update(statusId, updates) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const params = [];
      const allowedFields = ['name', 'display_name', 'description', 'is_active', 'is_default'];

      // Build the SET clause dynamically based on provided updates
      Object.entries(updates).forEach(([key, value]) => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          params.push(value);
        }
      });

      if (fields.length === 0) {
        return this.getById(statusId).then(resolve).catch(reject);
      }

      params.push(statusId);
      const query = `
        UPDATE qb_question_statuses 
        SET ${fields.join(', ')}
        WHERE status_id = ?
      `;

      db.run(query, params, function(err) {
        if (err) return reject(err);
        this.getById(statusId).then(resolve).catch(reject);
      }.bind(this));
    });
  }

  /**
   * Delete a status
   * @param {number} statusId - Status ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static delete(statusId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM qb_question_statuses WHERE status_id = ?',
        [statusId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Get valid status transitions for a role
   * @param {number} fromStatusId - Current status ID
   * @param {number} roleId - Role ID
   * @returns {Promise<Array>} List of valid status transitions
   */
  static getValidTransitions(fromStatusId, roleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ts.*, ts2.name as to_status_name, ts2.display_name as to_display_name
        FROM qb_question_status_transitions t
        JOIN qb_question_statuses ts ON t.from_status_id = ts.status_id
        JOIN qb_question_statuses ts2 ON t.to_status_id = ts2.status_id
        WHERE t.from_status_id = ? AND t.role_id = ? AND t.is_active = 1
      `;

      db.all(query, [fromStatusId, roleId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Get status history for a question
   * @param {number} questionId - Question ID
   * @param {Object} options - Query options
   * @param {number} [options.limit=50] - Maximum number of results
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Object>} Status history with pagination info
   */
  static getHistory(questionId, { limit = 50, offset = 0 } = {}) {
    return new Promise((resolve, reject) => {
      // First get total count
      db.get(
        'SELECT COUNT(*) as total FROM qb_question_status_history WHERE question_id = ?',
        [questionId],
        (countErr, countRow) => {
          if (countErr) return reject(countErr);

          const total = countRow ? countRow.total : 0;

          // Then get paginated results
          const query = `
            SELECT h.*, 
                   u.user_email, u.first_name, u.last_name,
                   fs.name as from_status_name, fs.display_name as from_display_name,
                   ts.name as to_status_name, ts.display_name as to_display_name
            FROM qb_question_status_history h
            LEFT JOIN base_master_users u ON h.changed_by = u.user_id
            LEFT JOIN qb_question_statuses fs ON h.from_status_id = fs.status_id
            JOIN qb_question_statuses ts ON h.to_status_id = ts.status_id
            WHERE h.question_id = ?
            ORDER BY h.created_at DESC
            LIMIT ? OFFSET ?
          `;

          db.all(query, [questionId, limit, offset], (err, rows) => {
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
          });
        }
      );
    });
  }

  /**
   * Add a status change to history
   * @param {Object} historyData - History data
   * @returns {Promise<Object>} Created history record
   */
  static addHistory(historyData) {
    return new Promise((resolve, reject) => {
      const { question_id, from_status_id, to_status_id, changed_by, comments } = historyData;
      
      db.run(
        `INSERT INTO qb_question_status_history 
         (question_id, from_status_id, to_status_id, changed_by, comments) 
         VALUES (?, ?, ?, ?, ?)`,
        [question_id, from_status_id, to_status_id, changed_by, comments || null],
        function(err) {
          if (err) return reject(err);
          
          // Return the full history record with joined data
          db.get(
            `SELECT h.*, 
                    u.user_email, u.first_name, u.last_name,
                    fs.name as from_status_name, fs.display_name as from_display_name,
                    ts.name as to_status_name, ts.display_name as to_display_name
             FROM qb_question_status_history h
             LEFT JOIN base_master_users u ON h.changed_by = u.user_id
             LEFT JOIN qb_question_statuses fs ON h.from_status_id = fs.status_id
             JOIN qb_question_statuses ts ON h.to_status_id = ts.status_id
             WHERE h.history_id = ?`,
            [this.lastID],
            (err, row) => {
              if (err) return reject(err);
              resolve(row || null);
            }
          );
        }
      );
    });
  }
}

module.exports = QuestionStatus;
