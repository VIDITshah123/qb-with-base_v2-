import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const { token } = await authService.refreshToken();
        localStorage.setItem('token', token);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (error) {
        // If refresh token fails, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

const companyService = {
  /**
   * Get paginated list of companies
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Number of items per page
   * @param {string} params.search - Search term
   * @param {string} params.status - Filter by status
   * @param {string} params.sortBy - Field to sort by
   * @param {string} params.sortOrder - Sort order (asc/desc)
   * @returns {Promise<Object>} - Paginated list of companies
   */
  getCompanies: async (params = {}) => {
    try {
      const response = await api.get('/companies', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  /**
   * Get company by ID
   * @param {string|number} id - Company ID
   * @returns {Promise<Object>} - Company details
   */
  getCompanyById: async (id) => {
    try {
      const response = await api.get(`/companies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new company
   * @param {Object} companyData - Company data
   * @returns {Promise<Object>} - Created company
   */
  createCompany: async (companyData) => {
    try {
      const response = await api.post('/companies', companyData);
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },

  /**
   * Update a company
   * @param {string|number} id - Company ID
   * @param {Object} companyData - Updated company data
   * @returns {Promise<Object>} - Updated company
   */
  updateCompany: async (id, companyData) => {
    try {
      const response = await api.put(`/companies/${id}`, companyData);
      return response.data;
    } catch (error) {
      console.error(`Error updating company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a company
   * @param {string|number} id - Company ID
   * @returns {Promise<void>}
   */
  deleteCompany: async (id) => {
    try {
      await api.delete(`/companies/${id}`);
    } catch (error) {
      console.error(`Error deleting company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update company status (active/inactive)
   * @param {string|number} id - Company ID
   * @param {boolean} isActive - New status
   * @returns {Promise<Object>} - Updated company
   */
  updateCompanyStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/companies/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get company statistics
   * @returns {Promise<Object>} - Company statistics
   */
  getCompanyStats: async () => {
    try {
      const response = await api.get('/companies/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }
};

export default companyService;
