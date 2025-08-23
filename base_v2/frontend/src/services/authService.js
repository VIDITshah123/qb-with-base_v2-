import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
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

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { token } = await refreshToken();
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear auth and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Response data
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear the token, even if the request fails
      localStorage.removeItem('token');
    }
  },

  /**
   * Refresh access token
   * @returns {Promise<Object>} New token
   */
  async refreshToken() {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Response data
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<Object>} Response data
   */
  async resetPassword(token, password, confirmPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(userData) {
    const response = await api.put('/auth/me', userData);
    return response.data;
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<Object>} Response data
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Verify email with token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Response data
   */
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  /**
   * Resend verification email
   * @returns {Promise<Object>} Response data
   */
  async resendVerificationEmail() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  /**
   * Check if email is verified
   * @returns {Promise<boolean>} True if email is verified
   */
  async checkEmailVerification() {
    try {
      const response = await api.get('/auth/check-verification');
      return response.data.isVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  },
};

export default authService;
