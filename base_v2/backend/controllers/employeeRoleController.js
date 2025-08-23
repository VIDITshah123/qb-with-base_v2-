const EmployeeRole = require('../models/employeeRole');
const Employee = require('../models/employee');
const { validationResult } = require('express-validator');

class EmployeeRoleController {
  // Assign a role to an employee
  static async assignRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { employeeId, companyId } = req.params;
      const { roleId } = req.body;
      const currentUserId = req.user.userId;

      // Verify the employee exists and belongs to the company
      const employee = await Employee.findById(employeeId, companyId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or not associated with this company'
        });
      }

      // Check if the current user can manage roles for this company
      const canManage = await EmployeeRole.canManageRoles(employeeId, companyId, currentUserId);
      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to assign roles in this company'
        });
      }

      // Assign the role
      const roleAssignmentId = await EmployeeRole.assign(employeeId, roleId, currentUserId);
      
      // Get the updated employee with roles
      const employeeWithRoles = await this.getEmployeeWithRoles(employeeId, companyId);

      res.status(201).json({
        success: true,
        message: 'Role assigned successfully',
        data: employeeWithRoles
      });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to assign role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Remove a role from an employee
  static async removeRole(req, res) {
    try {
      const { employeeRoleId, companyId } = req.params;
      const currentUserId = req.user.userId;

      // Remove the role
      const result = await EmployeeRole.remove(employeeRoleId, companyId, currentUserId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Role assignment not found or already removed'
        });
      }

      res.json({
        success: true,
        message: 'Role removed successfully'
      });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to remove role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all roles for an employee
  static async getEmployeeRoles(req, res) {
    try {
      const { employeeId, companyId } = req.params;
      const currentUserId = req.user.userId;

      // Verify the employee exists and belongs to the company
      const employee = await Employee.findById(employeeId, companyId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or not associated with this company'
        });
      }

      // Check if the current user can view roles for this company
      const canView = await EmployeeRole.canViewRoles(companyId, currentUserId);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view roles for this company'
        });
      }

      // Get the employee with roles
      const employeeWithRoles = await this.getEmployeeWithRoles(employeeId, companyId);
      
      res.json({
        success: true,
        data: employeeWithRoles
      });
    } catch (error) {
      console.error('Get employee roles error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch employee roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all employees with their roles for a company
  static async getCompanyEmployeesWithRoles(req, res) {
    try {
      const { companyId } = req.params;
      const currentUserId = req.user.userId;

      // Check if the current user can view roles for this company
      const canView = await EmployeeRole.canViewRoles(companyId, currentUserId);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view employee roles for this company'
        });
      }

      // Get all employees with their roles
      const employees = await EmployeeRole.findEmployeesWithRoles(companyId, currentUserId);
      
      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Get company employees with roles error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch employees with roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all assignable roles for the current user in a company
  static async getAssignableRoles(req, res) {
    try {
      const { companyId } = req.params;
      const currentUserId = req.user.userId;

      // Get assignable roles
      const roles = await EmployeeRole.getAssignableRoles(companyId, currentUserId);
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Get assignable roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignable roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Helper method to get an employee with their roles
  static async getEmployeeWithRoles(employeeId, companyId) {
    return new Promise((resolve, reject) => {
      db.get(
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
         WHERE e.employee_id = ? AND e.company_id = ?
         GROUP BY e.employee_id`,
        [employeeId, companyId],
        (err, row) => {
          if (err) return reject(err);
          
          if (!row) {
            return resolve(null);
          }
          
          // Parse the JSON array in the results
          const result = {
            ...row,
            roles: row.roles ? JSON.parse(row.roles).filter(r => r.role_id) : []
          };
          
          resolve(result);
        }
      );
    });
  }
}

module.exports = EmployeeRoleController;
