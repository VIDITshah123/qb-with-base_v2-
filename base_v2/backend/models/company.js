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

  // Find all companies (admin only)
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, u.user_email as owner_email 
         FROM qb_master_companies c
         JOIN base_master_users u ON c.user_id = u.user_id
         ORDER BY c.company_name`,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
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
}

module.exports = Company;
