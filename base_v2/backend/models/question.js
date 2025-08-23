const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class Question {
  // Question types and statuses as static properties
  static TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',
    TRUE_FALSE: 'true_false',
    SHORT_ANSWER: 'short_answer',
    ESSAY: 'essay',
    MATCHING: 'matching',
    FILL_BLANK: 'fill_blank'
  };

  static STATUS = {
    DRAFT: 'draft',
    PENDING_REVIEW: 'pending_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ARCHIVED: 'archived'
  };

  static DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
  };

  /**
   * Create a new question
   * @param {Object} questionData - Question data
   * @param {number} questionData.companyId - Company ID
   * @param {number} questionData.categoryId - Category ID (optional)
   * @param {string} questionData.type - Question type
   * @param {string} questionData.difficulty - Difficulty level
   * @param {string} questionData.questionText - The question text
   * @param {string} [questionData.explanation] - Explanation/answer
   * @param {number} userId - ID of the user creating the question
   * @param {Array} [options] - Array of question options (for multiple choice, etc.)
   * @param {Array} [tagIds] - Array of tag IDs
   * @returns {Promise<Object>} Created question with ID
   */
  static async create(questionData, userId, options = [], tagIds = []) {
    const {
      companyId,
      categoryId = null,
      type,
      difficulty,
      questionText,
      explanation = null
    } = questionData;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert the question
        db.run(
          `INSERT INTO qb_questions (
            company_id, category_id, question_type, difficulty_level,
            question_text, explanation, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [companyId, categoryId, type, difficulty, questionText, explanation, userId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            const questionId = this.lastID;
            const promises = [];

            // Add options if provided
            if (options && options.length > 0) {
              const stmt = db.prepare(
                `INSERT INTO qb_question_options 
                 (question_id, option_text, is_correct, option_order)
                 VALUES (?, ?, ?, ?)`
              );

              options.forEach((option, index) => {
                promises.push(
                  new Promise((resolveOption, rejectOption) => {
                    stmt.run(
                      [questionId, option.text, option.isCorrect ? 1 : 0, index + 1],
                      (err) => (err ? rejectOption(err) : resolveOption())
                    );
                  })
                );
              });
            }

            // Add tags if provided
            if (tagIds && tagIds.length > 0) {
              const stmt = db.prepare(
                `INSERT INTO qb_question_tag_mapping 
                 (question_id, tag_id) VALUES (?, ?)`
              );

              tagIds.forEach((tagId) => {
                promises.push(
                  new Promise((resolveTag, rejectTag) => {
                    stmt.run([questionId, tagId], (err) => 
                      err ? rejectTag(err) : resolveTag()
                    );
                  })
                );
              });
            }

            // Wait for all inserts to complete
            Promise.all(promises)
              .then(() => {
                db.run('COMMIT');
                resolve({ id: questionId, ...questionData });
              })
              .catch((error) => {
                db.run('ROLLBACK');
                reject(error);
              });
          }
        );
      });
    });
  }

  /**
   * Find question by ID with options and tags
   * @param {number} questionId - Question ID
   * @param {number} companyId - Company ID for access control
   * @returns {Promise<Object|null>} Question with options and tags
   */
  static async findById(questionId, companyId) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          // Get question
          const question = await new Promise((resolveQ, rejectQ) => {
            db.get(
              `SELECT q.*, 
                      u1.user_email as created_by_email,
                      u2.user_email as updated_by_email,
                      u3.user_email as reviewed_by_email,
                      qc.name as category_name
               FROM qb_questions q
               LEFT JOIN base_master_users u1 ON q.created_by = u1.user_id
               LEFT JOIN base_master_users u2 ON q.updated_by = u2.user_id
               LEFT JOIN base_master_users u3 ON q.reviewed_by = u3.user_id
               LEFT JOIN qb_question_categories qc ON q.category_id = qc.category_id
               WHERE q.question_id = ? AND q.company_id = ?`,
              [questionId, companyId],
              (err, row) => (err ? rejectQ(err) : resolveQ(row))
            );
          });

          if (!question) return resolve(null);

          // Get options
          const options = await new Promise((resolveOpt, rejectOpt) => {
            db.all(
              `SELECT option_id, option_text, is_correct, option_order
               FROM qb_question_options
               WHERE question_id = ?
               ORDER BY option_order`,
              [questionId],
              (err, rows) => (err ? rejectOpt(err) : resolveOpt(rows || []))
            );
          });

          // Get tags
          const tags = await new Promise((resolveTags, rejectTags) => {
            db.all(
              `SELECT t.tag_id, t.name
               FROM qb_question_tags t
               JOIN qb_question_tag_mapping m ON t.tag_id = m.tag_id
               WHERE m.question_id = ?`,
              [questionId],
              (err, rows) => (err ? rejectTags(err) : resolveTags(rows || []))
            );
          });

          // Get version count
          const versionCount = await new Promise((resolveCount, rejectCount) => {
            db.get(
              `SELECT COUNT(*) as count
               FROM qb_question_versions
               WHERE question_id = ?`,
              [questionId],
              (err, row) => (err ? rejectCount(err) : resolveCount(row ? row.count : 0))
            );
          });

          resolve({
            ...question,
            options,
            tags,
            version_count: versionCount
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Update a question
   * @param {number} questionId - Question ID
   * @param {Object} updateData - Fields to update
   * @param {number} userId - ID of the user updating the question
   * @returns {Promise<boolean>} True if updated successfully
   */
  static async update(questionId, updateData, userId) {
    const {
      categoryId,
      type,
      difficulty,
      questionText,
      explanation,
      status,
      options,
      tagIds
    } = updateData;

    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          // Get current question data for versioning
          const currentQuestion = await new Promise((resolveQ, rejectQ) => {
            db.get(
              `SELECT * FROM qb_questions WHERE question_id = ?`,
              [questionId],
              (err, row) => (err ? rejectQ(err) : resolveQ(row))
            );
          });

          if (!currentQuestion) {
            const error = new Error('Question not found');
            error.status = 404;
            throw error;
          }

          // Check if user has permission to update
          const canUpdate = await this.canUpdate(questionId, userId);
          if (!canUpdate) {
            const error = new Error('Not authorized to update this question');
            error.status = 403;
            throw error;
          }

          // Start transaction
          db.run('BEGIN TRANSACTION');

          // Create version before updating
          await new Promise((resolveVersion, rejectVersion) => {
            // Get current version number
            db.get(
              `SELECT COALESCE(MAX(version_number), 0) as max_version
               FROM qb_question_versions
               WHERE question_id = ?`,
              [questionId],
              (err, row) => {
                if (err) return rejectVersion(err);
                
                const newVersion = (row?.max_version || 0) + 1;
                
                // Save current state as a version
                db.run(
                  `INSERT INTO qb_question_versions 
                   (question_id, version_number, question_data, created_by)
                   VALUES (?, ?, ?, ?)`,
                  [
                    questionId,
                    newVersion,
                    JSON.stringify(currentQuestion),
                    userId
                  ],
                  (err) => (err ? rejectVersion(err) : resolveVersion())
                );
              }
            );
          });

          // Build update query
          const fields = [];
          const params = [];
          
          if (categoryId !== undefined) {
            fields.push('category_id = ?');
            params.push(categoryId);
          }
          if (type) {
            fields.push('question_type = ?');
            params.push(type);
          }
          if (difficulty) {
            fields.push('difficulty_level = ?');
            params.push(difficulty);
          }
          if (questionText) {
            fields.push('question_text = ?');
            params.push(questionText);
          }
          if (explanation !== undefined) {
            fields.push('explanation = ?');
            params.push(explanation);
          }
          if (status) {
            fields.push('status = ?');
            params.push(status);
            
            if (status === this.STATUS.APPROVED || status === this.STATUS.REJECTED) {
              fields.push('reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP');
              params.push(userId);
            }
          }
          
          // Always update updated_by and updated_at
          fields.push('updated_by = ?');
          params.push(userId);

          // Add question ID to params for WHERE clause
          params.push(questionId);

          // Execute update
          await new Promise((resolveUpdate, rejectUpdate) => {
            db.run(
              `UPDATE qb_questions SET ${fields.join(', ')} 
               WHERE question_id = ?`,
              params,
              function(err) {
                if (err) return rejectUpdate(err);
                resolveUpdate(this.changes > 0);
              }
            );
          });

          // Update options if provided
          if (options && Array.isArray(options)) {
            // Delete existing options
            await new Promise((resolveDelete, rejectDelete) => {
              db.run(
                'DELETE FROM qb_question_options WHERE question_id = ?',
                [questionId],
                (err) => (err ? rejectDelete(err) : resolveDelete())
              );
            });

            // Insert new options
            for (let i = 0; i < options.length; i++) {
              const option = options[i];
              await new Promise((resolveOption, rejectOption) => {
                db.run(
                  `INSERT INTO qb_question_options 
                   (question_id, option_text, is_correct, option_order)
                   VALUES (?, ?, ?, ?)`,
                  [questionId, option.text, option.isCorrect ? 1 : 0, i + 1],
                  (err) => (err ? rejectOption(err) : resolveOption())
                );
              });
            }
          }

          // Update tags if provided
          if (tagIds && Array.isArray(tagIds)) {
            // Delete existing tag mappings
            await new Promise((resolveDelete, rejectDelete) => {
              db.run(
                'DELETE FROM qb_question_tag_mapping WHERE question_id = ?',
                [questionId],
                (err) => (err ? rejectDelete(err) : resolveDelete())
              );
            });

            // Insert new tag mappings
            for (const tagId of tagIds) {
              await new Promise((resolveTag, rejectTag) => {
                db.run(
                  'INSERT INTO qb_question_tag_mapping (question_id, tag_id) VALUES (?, ?)',
                  [questionId, tagId],
                  (err) => (err ? rejectTag(err) : resolveTag())
                );
              });
            }
          }

          // Commit transaction
          db.run('COMMIT');
          resolve(true);
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  /**
   * Delete a question (soft delete)
   * @param {number} questionId - Question ID
   * @param {number} userId - ID of the user deleting the question
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async delete(questionId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_questions 
         SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE question_id = ?`,
        [userId, questionId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Find questions by filter criteria
   * @param {Object} filter - Filter criteria
   * @param {number} filter.companyId - Company ID (required)
   * @param {number} [filter.categoryId] - Category ID
   * @param {string} [filter.type] - Question type
   * @param {string} [filter.difficulty] - Difficulty level
   * @param {string} [filter.status] - Question status
   * @param {number} [filter.userId] - Created by user ID
   * @param {Array<number>} [filter.tagIds] - Array of tag IDs
   * @param {string} [filter.search] - Search term for question text
   * @param {number} [limit=20] - Number of results to return
   * @param {number} [offset=0] - Offset for pagination
   * @returns {Promise<Array>} List of questions with basic info
   */
  static async findByFilter(filter, limit = 20, offset = 0) {
    const {
      companyId,
      categoryId,
      type,
      difficulty,
      status,
      userId,
      tagIds,
      search
    } = filter;

    const conditions = ['q.company_id = ?', 'q.is_active = 1'];
    const params = [companyId];
    let joinClause = '';

    if (categoryId) {
      conditions.push('q.category_id = ?');
      params.push(categoryId);
    }

    if (type) {
      conditions.push('q.question_type = ?');
      params.push(type);
    }

    if (difficulty) {
      conditions.push('q.difficulty_level = ?');
      params.push(difficulty);
    }

    if (status) {
      conditions.push('q.status = ?');
      params.push(status);
    }

    if (userId) {
      conditions.push('q.created_by = ?');
      params.push(userId);
    }

    if (search) {
      conditions.push('(q.question_text LIKE ? OR q.explanation LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Handle tag filtering
    if (tagIds && tagIds.length > 0) {
      joinClause += ` JOIN qb_question_tag_mapping tm ON q.question_id = tm.question_id`;
      conditions.push('tm.tag_id IN (' + tagIds.map(() => '?').join(',') + ')')
      params.push(...tagIds);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // First, get the total count for pagination
    const countResult = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(DISTINCT q.question_id) as total
         FROM qb_questions q
         ${joinClause}
         ${whereClause}`,
        params,
        (err, row) => (err ? reject(err) : resolve(row?.total || 0))
      );
    });

    // Then get the paginated results
    const questions = await new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT q.question_id, q.question_type, q.difficulty_level, 
               q.question_text, q.status, q.created_at, q.updated_at,
               u.user_email as created_by_email,
               qc.name as category_name,
               (
                 SELECT GROUP_CONCAT(t.name, ', ')
                 FROM qb_question_tags t
                 JOIN qb_question_tag_mapping m ON t.tag_id = m.tag_id
                 WHERE m.question_id = q.question_id
               ) as tags
        FROM qb_questions q
        LEFT JOIN base_master_users u ON q.created_by = u.user_id
        LEFT JOIN qb_question_categories qc ON q.category_id = qc.category_id
        ${joinClause}
        ${whereClause}
        ORDER BY q.updated_at DESC
        LIMIT ? OFFSET ?`;

      db.all(query, [...params, limit, offset], (err, rows) => {
        if (err) return reject(err);
        
        // Parse tags string into array
        const formattedRows = rows.map(row => ({
          ...row,
          tags: row.tags ? row.tags.split(', ') : []
        }));
        
        resolve(formattedRows);
      });
    });

    return {
      total: countResult,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      data: questions
    };
  }

  /**
   * Check if a user can update a question
   * @param {number} questionId - Question ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user can update the question
   */
  static async canUpdate(questionId, userId) {
    return new Promise((resolve) => {
      // Check if user is the creator or has admin/editor role
      db.get(
        `SELECT 1 
         FROM qb_questions q
         LEFT JOIN qb_master_employees e ON q.company_id = e.company_id AND e.user_id = ?
         LEFT JOIN qb_employee_roles er ON e.employee_id = er.employee_id
         LEFT JOIN base_master_roles r ON er.role_id = r.role_id
         WHERE q.question_id = ? 
           AND (q.created_by = ? OR r.role_name IN ('admin', 'question_editor'))`,
        [userId, questionId, userId],
        (err, row) => {
          if (err) {
            console.error('Error checking update permission:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }

  /**
   * Get question versions
   * @param {number} questionId - Question ID
   * @returns {Promise<Array>} List of versions
   */
  static async getVersions(questionId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT v.version_id, v.version_number, v.change_summary, 
                v.created_at, u.user_email as created_by
         FROM qb_question_versions v
         JOIN base_master_users u ON v.created_by = u.user_id
         WHERE v.question_id = ?
         ORDER BY v.version_number DESC`,
        [questionId],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });
  }

  /**
   * Get a specific version of a question
   * @param {number} questionId - Question ID
   * @param {number} versionNumber - Version number
   * @returns {Promise<Object>} Question data at the specified version
   */
  static async getVersion(questionId, versionNumber) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT v.*, u.user_email as created_by
         FROM qb_question_versions v
         JOIN base_master_users u ON v.created_by = u.user_id
         WHERE v.question_id = ? AND v.version_number = ?`,
        [questionId, versionNumber],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          try {
            const questionData = JSON.parse(row.question_data);
            resolve({
              ...row,
              question_data: questionData
            });
          } catch (parseError) {
            reject(new Error('Failed to parse question data'));
          }
        }
      );
    });
  }

  /**
   * Get questions by IDs
   * @param {Array<number>} questionIds - Array of question IDs
   * @returns {Promise<Array>} List of questions with basic info
   */
  static async findByIds(questionIds) {
    if (!questionIds || questionIds.length === 0) {
      return [];
    }

    const placeholders = questionIds.map(() => '?').join(',');
    
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT q.question_id, q.question_type, q.difficulty_level, 
                q.question_text, q.status, q.created_at, q.updated_at,
                u.user_email as created_by_email,
                qc.name as category_name
         FROM qb_questions q
         LEFT JOIN base_master_users u ON q.created_by = u.user_id
         LEFT JOIN qb_question_categories qc ON q.category_id = qc.category_id
         WHERE q.question_id IN (${placeholders}) AND q.is_active = 1`,
        questionIds,
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });
  }

  /**
   * Get question statistics for dashboard
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics(companyId) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const result = {};
        
        // Get total questions by status
        db.all(
          `SELECT status, COUNT(*) as count
           FROM qb_questions
           WHERE company_id = ? AND is_active = 1
           GROUP BY status`,
          [companyId],
          (err, rows) => {
            if (err) return reject(err);
            
            const statusCounts = {
              draft: 0,
              pending_review: 0,
              approved: 0,
              rejected: 0,
              archived: 0
            };
            
            rows.forEach(row => {
              statusCounts[row.status] = row.count;
            });
            
            result.statusCounts = statusCounts;
            
            // Get questions by type
            db.all(
              `SELECT question_type as type, COUNT(*) as count
               FROM qb_questions
               WHERE company_id = ? AND is_active = 1
               GROUP BY question_type`,
              [companyId],
              (err, typeRows) => {
                if (err) return reject(err);
                
                result.typeCounts = typeRows || [];
                
                // Get questions by difficulty
                db.all(
                  `SELECT difficulty_level as difficulty, COUNT(*) as count
                   FROM qb_questions
                   WHERE company_id = ? AND is_active = 1
                   GROUP BY difficulty_level`,
                  [companyId],
                  (err, diffRows) => {
                    if (err) return reject(err);
                    
                    result.difficultyCounts = diffRows || [];
                    
                    // Get recent activity
                    db.all(
                      `SELECT q.question_id, q.question_text, q.updated_at,
                              u.user_email as updated_by_email
                       FROM qb_questions q
                       JOIN base_master_users u ON q.updated_by = u.user_id
                       WHERE q.company_id = ? AND q.is_active = 1
                       ORDER BY q.updated_at DESC
                       LIMIT 5`,
                      [companyId],
                      (err, activityRows) => {
                        if (err) return reject(err);
                        
                        result.recentActivity = activityRows || [];
                        resolve(result);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  }
}

module.exports = Question;
