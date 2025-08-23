import api from './api';

const employeeService = {
  // Get all employees for a company
  getCompanyEmployees: async (companyId, params = {}) => {
    try {
      const response = await api.get(`/api/employees/company/${companyId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get employee details
  getEmployee: async (employeeId, companyId) => {
    try {
      const response = await api.get(`/api/employees/${employeeId}/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  // Add a new employee
  addEmployee: async (companyId, employeeData) => {
    try {
      const response = await api.post(`/api/employees/company/${companyId}`, employeeData);
      return response.data;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  },

  // Update an employee
  updateEmployee: async (employeeId, companyId, employeeData) => {
    try {
      const response = await api.put(
        `/api/employees/${employeeId}/company/${companyId}`,
        employeeData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Remove an employee (soft delete)
  removeEmployee: async (employeeId, companyId) => {
    try {
      const response = await api.delete(`/api/employees/${employeeId}/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing employee:', error);
      throw error;
    }
  },

  // Update employee status
  updateEmployeeStatus: async (employeeId, companyId, isActive) => {
    try {
      const response = await api.patch(
        `/api/employees/${employeeId}/status/company/${companyId}`,
        { isActive }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  },

  // Get available roles for assignment
  getAvailableRoles: async (companyId) => {
    try {
      const response = await api.get(`/api/employee-roles/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Assign role to employee
  assignRole: async (employeeId, companyId, roleData) => {
    try {
      const response = await api.post(
        `/api/employee-roles/employee/${employeeId}/company/${companyId}`,
        roleData
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  // Remove role from employee
  removeRole: async (employeeId, roleId, companyId) => {
    try {
      const response = await api.delete(
        `/api/employee-roles/${roleId}/employee/${employeeId}/company/${companyId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  },
};

export default employeeService;
