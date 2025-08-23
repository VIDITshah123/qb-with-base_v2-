const db = require('../db');

class Company {
  // Create a new company
  static async create(companyData) {
    const { userId, companyName, gstNumber, city, state, country, pincode, address } = companyData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_master_companies 
         (user_id, company_name, company_gst_number, company_city, 
          company_state, company_country, company_pincode, company_address, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [userId, companyName, gstNumber, city, state, country, pincode, address],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  // Find company by ID
  static async findById(companyId, userId = null) {
    let query = `
      SELECT c.*, u.user_email as owner_email
      FROM qb_master_companies c
      JOIN base_master_users u ON c.user_id = u.user_id
      WHERE c.company_id = ?
    `;
    
    const params = [companyId];
    
    // If userId is provided, ensure the user owns the company (for non-admin users)
    if (userId) {
      query += ' AND (c.user_id = ? OR EXISTS (SELECT 1 FROM base_master_users WHERE user_id = ? AND is_admin = 1))';
      params.push(userId, userId);
    }
    
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  // Find all companies with pagination, search and filters (admin only)
  static async findAll({ page = 1, pageSize = 10, search = '', status = 'all', sortBy = 'company_name', sortOrder = 'asc' } = {}) {
    return new Promise((resolve, reject) => {
      // Build the query
      let query = `
        SELECT c.*, u.user_email as owner_email,
               (SELECT COUNT(*) FROM qb_master_employees e WHERE e.company_id = c.company_id) as employee_count
        FROM qb_master_companies c
        JOIN base_master_users u ON c.user_id = u.user_id
        WHERE 1=1
      `;
      
      const params = [];
      
      // Apply search filter
      if (search) {
        query += ` AND (
          c.company_name LIKE ? OR 
          c.company_gst_number LIKE ? OR 
          u.user_email LIKE ? OR
          c.company_city LIKE ?
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      // Apply status filter
      if (status === 'active') {
        query += ' AND c.is_active = 1';
      } else if (status === 'inactive') {
        query += ' AND c.is_active = 0';
      }
      
      // Add sorting
      const validSortColumns = ['company_name', 'created_at', 'employee_count', 'is_active'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'company_name';
      const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
      
      // Add sorting and pagination to main query
      query += ` ORDER BY ${sortColumn} ${order}`;
      query += ' LIMIT ? OFFSET ?';
      
      // Calculate pagination values
      const offset = (page - 1) * pageSize;
      
      // Execute count query first
      db.get(countQuery, params, (countErr, countRow) => {
        if (countErr) return reject(countErr);
        
        const total = countRow.total || 0;
        const totalPages = Math.ceil(total / pageSize);
        
        // Execute main query with pagination
        db.all(query, [...params, pageSize, offset], (err, rows) => {
          if (err) return reject(err);
          
          resolve({
            data: rows || [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total,
              totalPages
            }
          });
        });
      });
    });
  }

  // Find companies by user ID
  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, u.user_email as owner_email 
         FROM qb_master_companies c
         JOIN base_master_users u ON c.user_id = u.user_id
         WHERE c.user_id = ?
         ORDER BY c.company_name`,
        [userId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  // Update company
  static async update(companyId, userId, updateData) {
    const { companyName, gstNumber, city, state, country, pincode, address, isActive } = updateData;
    
    // Only the owner or admin can update
    const company = await this.findById(companyId, userId);
    if (!company) {
      const error = new Error('Company not found or access denied');
      error.status = 404;
      throw error;
    }
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_master_companies 
         SET company_name = COALESCE(?, company_name),
             company_gst_number = COALESCE(?, company_gst_number),
             company_city = COALESCE(?, company_city),
             company_state = COALESCE(?, company_state),
             company_country = COALESCE(?, company_country),
             company_pincode = COALESCE(?, company_pincode),
             company_address = COALESCE(?, company_address),
             is_active = COALESCE(?, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE company_id = ?`,
        [
          companyName, gstNumber, city, state, country, 
          pincode, address, isActive, companyId
        ],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Delete company (soft delete)
  static async delete(companyId, userId) {
    // Only the owner or admin can delete
    const company = await this.findById(companyId, userId);
    if (!company) {
      const error = new Error('Company not found or access denied');
      error.status = 404;
      throw error;
    }
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE qb_master_companies SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE company_id = ?',
        [companyId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Get company statistics
  static async getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_companies,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_companies,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_companies,
          (SELECT COUNT(DISTINCT user_id) FROM qb_master_companies) as total_company_owners,
          (SELECT COUNT(*) FROM qb_master_employees) as total_employees
        FROM qb_master_companies
      `;
      
      db.get(query, (err, row) => {
        if (err) return reject(err);
        resolve(row || {});
      });
    });
  }

  // Update company status
  static async updateStatus(companyId, isActive, userId) {
    // Verify user has permission
    const company = await this.findById(companyId, userId);
    if (!company) {
      const error = new Error('Company not found or access denied');
      error.status = 404;
      throw error;
    }
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE qb_master_companies SET is_active = ? WHERE company_id = ?',
        [isActive ? 1 : 0, companyId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }
  
  // Get recent companies
  static async getRecentCompanies(limit = 5) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, u.user_email as owner_email 
         FROM qb_master_companies c
         JOIN base_master_users u ON c.user_id = u.user_id
         ORDER BY c.created_at DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

}

module.exports = Company;
