const db = require('../db');

class EmployeeRole {
  // Assign a role to an employee
  static async assign(employeeId, roleId, assignedBy) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO qb_employee_roles (employee_id, role_id, assigned_by)
         VALUES (?, ?, ?)
         ON CONFLICT(employee_id, role_id) 
         DO UPDATE SET 
           is_active = 1,
           updated_at = CURRENT_TIMESTAMP`,
        [employeeId, roleId, assignedBy],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  // Remove a role from an employee (soft delete)
  static async remove(employeeRoleId, companyId, removerUserId) {
    // Verify the remover has permission
    const canManage = await this.canManageRoles(employeeRoleId, companyId, removerUserId);
    if (!canManage) {
      const error = new Error('Not authorized to manage roles');
      error.status = 403;
      throw error;
    }

    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM qb_employee_roles 
         WHERE employee_role_id = ?`,
        [employeeRoleId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Get all roles for an employee
  static async findByEmployeeId(employeeId, companyId = null) {
    let query = `
      SELECT er.*, r.role_name, r.role_description
      FROM qb_employee_roles er
      JOIN base_master_roles r ON er.role_id = r.role_id
      JOIN qb_master_employees e ON er.employee_id = e.employee_id
      WHERE er.employee_id = ? AND r.is_active = 1
    `;
    
    const params = [employeeId];
    
    if (companyId) {
      query += ' AND e.company_id = ?';
      params.push(companyId);
    }
    
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  // Get all employees with their roles for a company
  static async findEmployeesWithRoles(companyId, userId) {
    // Verify the user has permission to view employee roles
    const canView = await this.canViewRoles(companyId, userId);
    if (!canView) {
      const error = new Error('Not authorized to view employee roles');
      error.status = 403;
      throw error;
    }

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           e.employee_id,
           e.user_id,
           u.user_email,
           u.first_name,
           u.last_name,
           e.company_id,
           c.company_name,
           json_group_array(
             json_object(
               'role_id', r.role_id,
               'role_name', r.role_name,
               'role_description', r.role_description,
               'assigned_at', er.created_at
             )
           ) as roles
         FROM qb_master_employees e
         JOIN base_master_users u ON e.user_id = u.user_id
         JOIN qb_master_companies c ON e.company_id = c.company_id
         LEFT JOIN qb_employee_roles er ON e.employee_id = er.employee_id
         LEFT JOIN base_master_roles r ON er.role_id = r.role_id AND r.is_active = 1
         WHERE e.company_id = ? AND e.is_active = 1
         GROUP BY e.employee_id
         ORDER BY u.first_name, u.last_name`,
        [companyId],
        (err, rows) => {
          if (err) return reject(err);
          
          // Parse the JSON arrays in the results
          const result = rows.map(row => ({
            ...row,
            roles: row.roles ? JSON.parse(row.roles).filter(r => r.role_id) : []
          }));
          
          resolve(result);
        }
      );
    });
  }

  // Check if a user can manage roles for a company
  static async canManageRoles(employeeRoleId, companyId, userId) {
    // Company admins and system admins can manage roles
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_employees e
         JOIN qb_employee_roles er ON e.employee_id = er.employee_id
         JOIN base_master_roles r ON er.role_id = r.role_id
         WHERE e.user_id = ? 
           AND e.company_id = ? 
           AND e.is_active = 1
           AND r.role_name IN ('company_admin', 'admin')
           AND (
             -- Either the user is a system admin
             r.role_name = 'admin'
             -- Or the user is a company admin and the role assignment is for their company
             OR (r.role_name = 'company_admin' AND e.company_id = ?)
           )`,
        [userId, companyId, companyId],
        (err, row) => {
          if (err) return resolve(false);
          resolve(!!row);
        }
      );
    });
  }

  // Check if a user can view roles for a company
  static async canViewRoles(companyId, userId) {
    // Company admins, system admins, and employees with role management permissions can view roles
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_employees e
         JOIN qb_employee_roles er ON e.employee_id = er.employee_id
         JOIN base_master_roles r ON er.role_id = r.role_id
         WHERE e.user_id = ? 
           AND e.company_id = ? 
           AND e.is_active = 1
           AND r.role_name IN ('company_admin', 'admin', 'hr_manager')`,
        [userId, companyId],
        (err, row) => {
          if (err) return resolve(false);
          resolve(!!row);
        }
      );
    });
  }

  // Get all available roles that can be assigned
  static async getAssignableRoles(companyId, userId) {
    // System admins can assign any role
    // Company admins can only assign non-admin roles
    return new Promise((resolve) => {
      db.all(
        `SELECT r.*
         FROM base_master_roles r
         WHERE r.is_active = 1
           AND (
             -- System admins can assign any role
             EXISTS (
               SELECT 1 
               FROM qb_master_employees e
               JOIN qb_employee_roles er ON e.employee_id = er.employee_id
               JOIN base_master_roles ar ON er.role_id = ar.role_id
               WHERE e.user_id = ? AND ar.role_name = 'admin' AND e.is_active = 1
             )
             -- Or company admins can assign non-admin roles
             OR (
               r.role_name != 'admin' 
               AND EXISTS (
                 SELECT 1 
                 FROM qb_master_employees e
                 JOIN qb_employee_roles er ON e.employee_id = er.employee_id
                 JOIN base_master_roles ar ON er.role_id = ar.role_id
                 WHERE e.user_id = ? 
                   AND e.company_id = ? 
                   AND ar.role_name = 'company_admin' 
                   AND e.is_active = 1
               )
             )
           )
         ORDER BY r.role_name`,
        [userId, userId, companyId],
        (err, rows) => {
          if (err) return resolve([]);
          resolve(rows || []);
        }
      );
    });
  }
}

module.exports = EmployeeRole;
