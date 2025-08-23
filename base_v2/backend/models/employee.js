const db = require('../db');

class Employee {
  // Add an employee to a company
  static async add(companyId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_master_employees (company_id, user_id, is_active)
         VALUES (?, ?, 1)
         ON CONFLICT(company_id, user_id) 
         DO UPDATE SET is_active = 1, updated_at = CURRENT_TIMESTAMP`,
        [companyId, userId],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  // Remove an employee from a company (soft delete)
  static async remove(companyId, userId, removerUserId) {
    // Verify the remover has permission (company owner or admin)
    const canRemove = await this.canManageEmployees(companyId, removerUserId);
    if (!canRemove) {
      const error = new Error('Not authorized to remove employees');
      error.status = 403;
      throw error;
    }

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_master_employees 
         SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
         WHERE company_id = ? AND user_id = ?`,
        [companyId, userId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Get all employees for a company with optional field selection
  static async findByCompanyId(companyId, userId, fields = '*') {
    // Verify the user has permission to view employees
    const canView = await this.canViewEmployees(companyId, userId);
    if (!canView) {
      const error = new Error('Not authorized to view employees');
      error.status = 403;
      throw error;
    }

    // If fields is an array, join it into a string
    const fieldList = Array.isArray(fields) ? fields.join(', ') : fields;

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ${fieldList} 
         FROM qb_master_employees e
         JOIN base_master_users u ON e.user_id = u.user_id
         WHERE e.company_id = ? AND e.is_active = 1`,
        [companyId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  // Get employee details
  static async findById(employeeId, companyId = null) {
    let query = `
      SELECT e.*, u.user_email, u.first_name, u.last_name, c.company_name
      FROM qb_master_employees e
      JOIN base_master_users u ON e.user_id = u.user_id
      JOIN qb_master_companies c ON e.company_id = c.company_id
      WHERE e.employee_id = ?
    `;
    
    const params = [employeeId];
    
    if (companyId) {
      query += ' AND e.company_id = ?';
      params.push(companyId);
    }
    
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  // Check if a user can manage employees for a company
  static async canManageEmployees(companyId, userId) {
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_companies c
         JOIN base_master_users u ON c.user_id = u.user_id
         WHERE c.company_id = ? AND (c.user_id = ? OR u.is_admin = 1)`,
        [companyId, userId],
        (err, row) => {
          if (err) return resolve(false);
          resolve(!!row);
        }
      );
    });
  }

  // Check if a user can view employees in a company
  static async canViewEmployees(companyId, userId) {
    // Company owners and admins can view employees
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_employees e
         LEFT JOIN qb_employee_roles er ON e.employee_id = er.employee_id
         LEFT JOIN base_master_roles r ON er.role_id = r.role_id
         WHERE e.company_id = ? 
           AND e.user_id = ? 
           AND e.is_active = 1
           AND (
             -- Company admins and system admins can view all employees
             r.role_name IN ('company_admin', 'admin')
             -- Or the user is viewing their own employee record
             OR EXISTS (
               SELECT 1 
               FROM qb_master_employees self 
               WHERE self.user_id = ? 
                 AND self.company_id = ? 
                 AND self.is_active = 1
             )
           )`,
        [companyId, userId, userId, companyId],
        (err, row) => {
          if (err) {
            console.error('Error checking view employees permission:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }

  // Get companies where a user is an employee with role information
  static async findCompaniesByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           c.*,
           e.employee_id,
           e.department,
           e.position,
           e.hire_date,
           e.created_at as employee_since
         FROM qb_master_companies c
         JOIN qb_master_employees e ON c.company_id = e.company_id
         WHERE e.user_id = ? 
           AND e.is_active = 1 
           AND c.is_active = 1`,
        [userId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }
  
  // Find employee by user ID and company ID
  static async findByUserIdAndCompanyId(userId, companyId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * 
         FROM qb_master_employees 
         WHERE user_id = ? AND company_id = ? AND is_active = 1`,
        [userId, companyId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }
}

module.exports = Employee;
