const db = require('../db');

class Category {
  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {number} categoryData.companyId - Company ID
   * @param {string} categoryData.name - Category name
   * @param {string} [categoryData.description] - Category description
   * @param {number} [categoryData.parentId] - Parent category ID
   * @param {number} userId - ID of the user creating the category
   * @returns {Promise<Object>} Created category
   */
  static async create({ companyId, name, description = null, parentId = null }, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_question_categories 
         (company_id, name, description, parent_id, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [companyId, name, description, parentId, userId],
        function(err) {
          if (err) return reject(err);
          resolve({
            categoryId: this.lastID,
            companyId,
            name,
            description,
            parentId,
            createdBy: userId
          });
        }
      );
    });
  }

  /**
   * Get category by ID
   * @param {number} categoryId - Category ID
   * @param {number} companyId - Company ID for access control
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  static async findById(categoryId, companyId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, 
                u1.user_email as created_by_email,
                u2.user_email as updated_by_email,
                p.name as parent_name
         FROM qb_question_categories c
         LEFT JOIN base_master_users u1 ON c.created_by = u1.user_id
         LEFT JOIN base_master_users u2 ON c.updated_by = u2.user_id
         LEFT JOIN qb_question_categories p ON c.parent_id = p.category_id
         WHERE c.category_id = ? AND c.company_id = ?`,
        [categoryId, companyId],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          // Get child categories count
          db.get(
            `SELECT COUNT(*) as count 
             FROM qb_question_categories 
             WHERE parent_id = ?`,
            [categoryId],
            (err, countRow) => {
              if (err) return reject(err);
              
              // Get questions count
              db.get(
                `SELECT COUNT(*) as count 
                 FROM qb_questions 
                 WHERE category_id = ? AND is_active = 1`,
                [categoryId],
                (err, questionRow) => {
                  if (err) return reject(err);
                  
                  resolve({
                    ...row,
                    childrenCount: countRow ? countRow.count : 0,
                    questionsCount: questionRow ? questionRow.count : 0
                  });
                }
              );
            }
          );
        }
      );
    });
  }

  /**
   * Update a category
   * @param {number} categoryId - Category ID
   * @param {Object} updateData - Fields to update
   * @param {string} [updateData.name] - New category name
   * @param {string} [updateData.description] - New description
   * @param {number} [updateData.parentId] - New parent category ID
   * @param {boolean} [updateData.isActive] - Active status
   * @param {number} userId - ID of the user updating the category
   * @returns {Promise<boolean>} True if updated successfully
   */
  static async update(categoryId, updateData, userId) {
    const { name, description, parentId, isActive } = updateData;
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (parentId !== undefined) {
      // Prevent circular references
      if (parentId === categoryId) {
        throw new Error('A category cannot be its own parent');
      }
      
      // Check if parent exists and belongs to the same company
      if (parentId !== null) {
        const parent = await this.findById(parentId, updateData.companyId);
        if (!parent) {
          throw new Error('Parent category not found or access denied');
        }
      }
      
      updates.push('parent_id = ?');
      params.push(parentId);
    }
    
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return false; // No updates
    }
    
    // Add updated_by and category_id to params
    updates.push('updated_by = ?');
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId, categoryId);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_question_categories 
         SET ${updates.join(', ')} 
         WHERE category_id = ?`,
        params,
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Delete a category (soft delete)
   * @param {number} categoryId - Category ID
   * @param {number} companyId - Company ID for access control
   * @param {number} userId - ID of the user deleting the category
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async delete(categoryId, companyId, userId) {
    // Check if category has child categories
    const hasChildren = await new Promise((resolve) => {
      db.get(
        `SELECT 1 FROM qb_question_categories 
         WHERE parent_id = ? AND is_active = 1 
         LIMIT 1`,
        [categoryId],
        (err, row) => resolve(!!row)
      );
    });
    
    if (hasChildren) {
      throw new Error('Cannot delete category with active subcategories');
    }
    
    // Check if category has questions
    const hasQuestions = await new Promise((resolve) => {
      db.get(
        `SELECT 1 FROM qb_questions 
         WHERE category_id = ? AND is_active = 1 
         LIMIT 1`,
        [categoryId],
        (err, row) => resolve(!!row)
      );
    });
    
    if (hasQuestions) {
      throw new Error('Cannot delete category with active questions');
    }
    
    // Soft delete the category
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_question_categories 
         SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE category_id = ? AND company_id = ?`,
        [userId, categoryId, companyId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Get all categories for a company (with optional tree structure)
   * @param {number} companyId - Company ID
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.asTree] - Return as a tree structure
   * @param {number} [options.parentId] - Filter by parent ID
   * @param {boolean} [options.includeInactive] - Include inactive categories
   * @returns {Promise<Array>} List of categories
   */
  static async findByCompany(companyId, { asTree = false, parentId = null, includeInactive = false } = {}) {
    return new Promise((resolve, reject) => {
      const conditions = ['c.company_id = ?'];
      const params = [companyId];
      
      if (parentId !== null) {
        conditions.push('c.parent_id = ?');
        params.push(parentId);
      } else if (!asTree) {
        conditions.push('c.parent_id IS NULL');
      }
      
      if (!includeInactive) {
        conditions.push('c.is_active = 1');
      }
      
      db.all(
        `SELECT c.*, 
                u1.user_email as created_by_email,
                u2.user_email as updated_by_email,
                p.name as parent_name,
                (SELECT COUNT(*) FROM qb_questions q WHERE q.category_id = c.category_id AND q.is_active = 1) as questions_count,
                (SELECT COUNT(*) FROM qb_question_categories child WHERE child.parent_id = c.category_id AND child.is_active = 1) as children_count
         FROM qb_question_categories c
         LEFT JOIN base_master_users u1 ON c.created_by = u1.user_id
         LEFT JOIN base_master_users u2 ON c.updated_by = u2.user_id
         LEFT JOIN qb_question_categories p ON c.parent_id = p.category_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY c.name`,
        params,
        async (err, rows) => {
          if (err) return reject(err);
          
          if (!asTree) {
            return resolve(rows || []);
          }
          
          // Build category tree
          const buildTree = async (parentId) => {
            const children = rows.filter(cat => 
              (cat.parent_id === parentId) || 
              (parentId === null && cat.parent_id === null)
            );
            
            for (const child of children) {
              child.children = await buildTree(child.category_id);
            }
            
            return children;
          };
          
          const tree = await buildTree(parentId);
          resolve(tree);
        }
      );
    });
  }

  /**
   * Move questions from one category to another
   * @param {number} fromCategoryId - Source category ID
   * @param {number} toCategoryId - Target category ID
   * @param {number} companyId - Company ID for access control
   * @param {number} userId - ID of the user performing the action
   * @returns {Promise<boolean>} True if successful
   */
  static async moveQuestions(fromCategoryId, toCategoryId, companyId, userId) {
    // Verify both categories exist and belong to the company
    const [fromCategory, toCategory] = await Promise.all([
      this.findById(fromCategoryId, companyId),
      toCategoryId ? this.findById(toCategoryId, companyId) : { categoryId: null }
    ]);
    
    if (!fromCategory) {
      throw new Error('Source category not found or access denied');
    }
    
    if (toCategoryId !== null && !toCategory) {
      throw new Error('Target category not found or access denied');
    }
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_questions 
         SET category_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE category_id = ?`,
        [toCategoryId, userId, fromCategoryId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Get category statistics
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>} Category statistics
   */
  static async getStatistics(companyId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_categories,
           SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as root_categories,
           SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as subcategories,
           (SELECT COUNT(*) FROM qb_questions q 
            JOIN qb_question_categories c ON q.category_id = c.category_id 
            WHERE c.company_id = ? AND q.is_active = 1) as questions_with_category,
           (SELECT COUNT(*) FROM qb_questions 
            WHERE company_id = ? AND category_id IS NULL AND is_active = 1) as questions_without_category
         FROM qb_question_categories 
         WHERE company_id = ? AND is_active = 1`,
        [companyId, companyId, companyId],
        (err, stats) => {
          if (err) return reject(err);
          
          // Get category with most questions
          db.get(
            `SELECT c.category_id, c.name, COUNT(q.question_id) as question_count
             FROM qb_question_categories c
             LEFT JOIN qb_questions q ON c.category_id = q.category_id AND q.is_active = 1
             WHERE c.company_id = ? AND c.is_active = 1
             GROUP BY c.category_id
             ORDER BY question_count DESC
             LIMIT 1`,
            [companyId],
            (err, topCategory) => {
              if (err) return reject(err);
              
              resolve({
                ...stats,
                topCategory: topCategory || null
              });
            }
          );
        }
      );
    });
  }
}

module.exports = Category;
