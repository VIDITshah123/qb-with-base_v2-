const Employee = require('../models/employee');
const { validationResult } = require('express-validator');
const DataIsolation = require('../middleware/dataIsolation');

class EmployeeController {
  // Add an employee to a company
  static async addEmployee(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { companyId } = req.params;
      const { userId } = req.body;
      const currentUserId = req.user.userId;

      // Check if the current user can manage employees for this company
      const canManage = await Employee.canManageEmployees(companyId, currentUserId);
      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add employees to this company'
        });
      }

      // Add the employee
      const employeeId = await Employee.add(companyId, userId);
      
      // Get the newly added employee details
      const employee = await Employee.findById(employeeId, companyId);

      res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        data: employee
      });
    } catch (error) {
      console.error('Add employee error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to add employee',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Remove an employee from a company
  static async removeEmployee(req, res) {
    try {
      const { companyId, employeeId } = req.params;
      const currentUserId = req.user.userId;

      // Get the employee to verify company association
      const employee = await Employee.findById(employeeId, companyId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or not associated with this company'
        });
      }

      // Remove the employee
      const result = await Employee.remove(companyId, employee.user_id, currentUserId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or already removed'
        });
      }

      res.json({
        success: true,
        message: 'Employee removed successfully'
      });
    } catch (error) {
      console.error('Remove employee error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to remove employee',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all employees for a company
  static async getEmployeesByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const currentUserId = req.user.userId;

      // Check if the current user can view employees for this company
      const canView = await Employee.canViewEmployees(companyId, currentUserId);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view employees for this company'
        });
      }

      // Get all employees for the company with role-based field filtering
      const isAdmin = await DataIsolation.isUserAdmin(currentUserId);
      const isOwner = await DataIsolation.isCompanyOwner(companyId, currentUserId);
      
      // Define fields to select based on user role
      let fields = '*'; // Default to all fields for admins/owners
      
      if (!isAdmin && !isOwner) {
        // Non-admin, non-owner users get limited fields
        fields = [
          'e.employee_id',
          'u.user_id',
          'u.first_name',
          'u.last_name',
          'u.user_email',
          'e.department',
          'e.position',
          'e.hire_date',
          'e.is_active',
          'e.created_at',
          'e.updated_at',
          // Include role information
          `(
            SELECT json_group_array(json_object(
              'role_id', r.role_id,
              'role_name', r.role_name,
              'role_description', r.role_description
            ))
            FROM qb_employee_roles er
            JOIN base_master_roles r ON er.role_id = r.role_id
            WHERE er.employee_id = e.employee_id
              AND r.is_active = 1
          ) as roles`
        ].join(',');
      }
      
      // Get employees with appropriate field selection
      const employees = await Employee.findByCompanyId(companyId, fields);
      
      // Parse the JSON strings in the results
      const processedEmployees = employees.map(emp => ({
        ...emp,
        roles: emp.roles ? JSON.parse(emp.roles) : []
      }));
      
      res.json({
        success: true,
        data: processedEmployees
      });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch employees',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get employee details
  static async getEmployeeDetails(req, res) {
    try {
      const { employeeId, companyId } = req.params;
      const currentUserId = req.user.userId;

      // Check if the current user can view this employee
      const canView = await Employee.canViewEmployee(employeeId, companyId, currentUserId);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this employee'
        });
      }

      // Get the employee details with role-based field filtering
      const isAdmin = await DataIsolation.isUserAdmin(currentUserId);
      const isOwner = await DataIsolation.isCompanyOwner(companyId, currentUserId);
      const isSelf = await DataIsolation.isEmployeeSelf(employeeId, currentUserId);
      
      // Define fields to select based on user role
      let fields = '*'; // Default to all fields for admins/owners
      
      if (!isAdmin && !isOwner) {
        // Non-admin, non-owner users get limited fields
        fields = [
          'e.employee_id',
          'u.user_id',
          'u.first_name',
          'u.last_name',
          'u.user_email',
          'e.department',
          'e.position',
          'e.hire_date',
          'e.is_active',
          'e.created_at',
          'e.updated_at',
          // Include role information
          `(
            SELECT json_group_array(json_object(
              'role_id', r.role_id,
              'role_name', r.role_name,
              'role_description', r.role_description
            ))
            FROM qb_employee_roles er
            JOIN base_master_roles r ON er.role_id = r.role_id
            WHERE er.employee_id = e.employee_id
              AND r.is_active = 1
          ) as roles`
        ].join(',');
        
        // If it's the user's own profile, include additional fields
        if (isSelf) {
          fields += ', u.phone, u.profile_image, u.preferences';
        }
      }
      
      // Get employee with appropriate field selection
      const employee = await Employee.findById(employeeId, companyId, fields);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      
      // Parse the JSON strings in the results
      if (employee.roles) {
        employee.roles = JSON.parse(employee.roles);
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch employee',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get companies where the current user is an employee
  static async getMyCompanies(req, res) {
    try {
      const userId = req.user.userId;
      
      // Get all companies where the user is an employee with role information
      const companies = await Employee.findCompaniesByUserId(userId);
      
      // For each company, add the user's roles in that company
      const companiesWithRoles = await Promise.all(companies.map(async company => {
        // Get the employee ID for this company
        const employee = await Employee.findByUserIdAndCompanyId(userId, company.company_id);
        
        if (employee) {
          // Get roles for this employee
          const roles = await EmployeeRole.findByEmployeeId(employee.employee_id, company.company_id);
          return {
            ...company,
            user_roles: roles.map(r => ({
              role_id: r.role_id,
              role_name: r.role_name,
              role_description: r.role_description
            }))
          };
        }
        
        return company;
      }));
      
      res.json({
        success: true,
        data: companiesWithRoles
      });
    } catch (error) {
      console.error('Get my companies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your companies',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = EmployeeController;
