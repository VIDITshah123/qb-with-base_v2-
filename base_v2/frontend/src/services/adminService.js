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

const adminService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Recent Activity
  getRecentActivity: async (limit = 5) => {
    try {
      const response = await api.get(`/admin/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  // System Health
  getSystemHealth: async () => {
    try {
      const response = await api.get('/admin/system/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },

  // Run Backup
  runBackup: async () => {
    try {
      const response = await api.post('/admin/system/backup');
      return response.data;
    } catch (error) {
      console.error('Error running backup:', error);
      throw error;
    }
  },

  // Get System Alerts
  getSystemAlerts: async () => {
    try {
      const response = await api.get('/admin/system/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      throw error;
    }
  },

  // Get Quick Links (could be dynamic based on user permissions)
  getQuickLinks: async () => {
    try {
      const response = await api.get('/admin/quick-links');
      return response.data;
    } catch (error) {
      console.error('Error fetching quick links:', error);
      // Return default links if API fails
      return [
        { name: 'User Management', link: '/admin/users', icon: 'users' },
        { name: 'Company Management', link: '/admin/companies', icon: 'briefcase' },
        { name: 'System Settings', link: '/admin/settings', icon: 'settings' },
        { name: 'Audit Logs', link: '/admin/audit-logs', icon: 'file-text' },
        { name: 'Role Management', link: '/admin/roles', icon: 'shield' },
        { name: 'System Health', link: '/admin/health', icon: 'activity' },
      ];
    }
  }
};

export default adminService;
