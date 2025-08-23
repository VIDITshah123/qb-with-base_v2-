const db = require('../db');
const Question = require('../models/question');

class DataIsolation {
  // Middleware to ensure the user has access to the requested company's data
  static async companyDataAccess(req, res, next) {
    try {
      const { companyId } = req.params;
      const userId = req.user.userId;
      
      // Skip if no company ID in params
      if (!companyId) {
        return next();
      }

      // Check if the user is an admin
      const isAdmin = await this.isUserAdmin(userId);
      if (isAdmin) {
        return next();
      }

      // Check if the user is the owner of the company
      const isOwner = await this.isCompanyOwner(companyId, userId);
      if (isOwner) {
        return next();
      }

      // Check if the user is an employee of the company
      const isEmployee = await this.isCompanyEmployee(companyId, userId);
      if (isEmployee) {
        return next();
      }

      // If none of the above, deny access
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this company\'s data'
      });
    } catch (error) {
      console.error('Data isolation error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while checking data access permissions'
      });
    }
  }

  // Check if user is a system admin
  static isUserAdmin(userId) {
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM base_master_users u
         JOIN base_role_user_link rul ON u.user_id = rul.user_id
         JOIN base_master_roles r ON rul.role_id = r.role_id
         WHERE u.user_id = ? AND r.role_name = 'admin' AND u.is_active = 1`,
        [userId],
        (err, row) => {
          if (err) {
            console.error('Error checking admin status:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }

  // Check if user is the owner of the company
  static isCompanyOwner(companyId, userId) {
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_companies 
         WHERE company_id = ? AND user_id = ? AND is_active = 1`,
        [companyId, userId],
        (err, row) => {
          if (err) {
            console.error('Error checking company ownership:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }

  // Check if user is an employee of the company
  static isCompanyEmployee(companyId, userId) {
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_employees e
         WHERE e.company_id = ? 
           AND e.user_id = ? 
           AND e.is_active = 1`,
        [companyId, userId],
        (err, row) => {
          if (err) {
            console.error('Error checking employee status:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }

  // Middleware to filter query results by company ID
  static async filterByCompany(req, res, next) {
    try {
      const companyId = req.params.companyId;
      const userId = req.user.userId;

      // Skip if no company ID in params
      if (!companyId) {
        return next();
      }

      // For admins, allow access to all data
      const isAdmin = await this.isUserAdmin(userId);
      if (isAdmin) {
        return next();
      }

      // For company owners/employees, ensure they only access their company's data
      const hasAccess = await this.hasCompanyAccess(companyId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to access this data'
        });
      }

      // Add company filter to the request for use in controllers
      req.companyFilter = { company_id: companyId };
      next();
    } catch (error) {
      console.error('Data filtering error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while filtering data'
      });
    }
  }

  // Check if user has access to the company
  static async hasCompanyAccess(companyId, userId) {
    const isOwner = await this.isCompanyOwner(companyId, userId);
    if (isOwner) return true;

    const isEmployee = await this.isCompanyEmployee(companyId, userId);
    return isEmployee;
  }

  // Middleware to ensure the user can only manage their own company's employees
  static async employeeManagementAccess(req, res, next) {
    try {
      const { companyId, employeeId } = req.params;
      const userId = req.user.userId;

      // Check if user is an admin
      const isAdmin = await this.isUserAdmin(userId);
      if (isAdmin) return next();

      // Check if user is the company owner
      const isOwner = await this.isCompanyOwner(companyId, userId);
      if (isOwner) return next();

      // Check if user is a company admin
      const isCompanyAdmin = await this.hasCompanyRole(companyId, userId, 'company_admin');
      if (isCompanyAdmin) return next();

      // For employee-specific endpoints, check if the user is accessing their own record
      if (employeeId) {
        const isSelf = await this.isEmployeeSelf(employeeId, userId);
        if (isSelf) return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to manage employees in this company'
      });
    } catch (error) {
      console.error('Employee management access error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while checking employee management permissions'
      });
    }
  }

  // Check if user has a specific role in a company
  static hasCompanyRole(companyId, userId, roleName) {
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_employees e
         JOIN qb_employee_roles er ON e.employee_id = er.employee_id
         JOIN base_master_roles r ON er.role_id = r.role_id
         WHERE e.company_id = ? 
           AND e.user_id = ? 
           AND r.role_name = ? 
           AND e.is_active = 1 
           AND r.is_active = 1`,
        [companyId, userId, roleName],
        (err, row) => {
          if (err) {
            console.error('Error checking company role:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }

  // Check if the employee record belongs to the user
  static isEmployeeSelf(employeeId, userId) {
    return new Promise((resolve) => {
      db.get(
        `SELECT 1 
         FROM qb_master_employees 
         WHERE employee_id = ? AND user_id = ? AND is_active = 1`,
        [employeeId, userId],
        (err, row) => {
          if (err) {
            console.error('Error checking employee self:', err);
            return resolve(false);
          }
          resolve(!!row);
        }
      );
    });
  }
}

module.exports = DataIsolation;
