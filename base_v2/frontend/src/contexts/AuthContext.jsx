import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const navigate = useNavigate();

  // Check email verification status
  const checkEmailVerification = async () => {
    if (!token) return false;
    try {
      setCheckingVerification(true);
      const isVerified = await authService.checkEmailVerification();
      setIsEmailVerified(isVerified);
      return isVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    } finally {
      setCheckingVerification(false);
    }
  };

  // Update user verification status
  const updateEmailVerification = (status) => {
    setIsEmailVerified(status);
    if (user) {
      setUser(prev => ({
        ...prev,
        isEmailVerified: status
      }));
    }
  };

  // Check if token exists and is valid on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const decoded = jwtDecode(storedToken);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            await handleLogout();
          } else {
            setUser(decoded);
            setToken(storedToken);
            // Check email verification status
            await checkEmailVerification();
            // Set up token refresh
            setupTokenRefresh(decoded.exp);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        await handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setupTokenRefresh = (exp) => {
    // Refresh token 5 minutes before it expires
    const refreshTime = (exp * 1000) - (5 * 60 * 1000) - Date.now();
    
    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          await handleLogout();
        }
      }, refreshTime);
    }
  };

  const refreshToken = async () => {
    try {
      const { token: newToken } = await authService.refreshToken();
      localStorage.setItem('token', newToken);
      const decoded = jwtDecode(newToken);
      setUser(decoded);
      setToken(newToken);
      setupTokenRefresh(decoded.exp);
      return newToken;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { token: authToken, user: userData } = await authService.login(email, password);
      localStorage.setItem('token', authToken);
      const decoded = jwtDecode(authToken);
      setUser(decoded);
      setToken(authToken);
      // Check email verification status after login
      const isVerified = await checkEmailVerification();
      setupTokenRefresh(decoded.exp);
      return { 
        success: true,
        isEmailVerified: isVerified
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(userData);
      // Auto-login after registration
      const { email, password } = userData;
      return await login(email, password);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      navigate('/login');
    }
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isEmailVerified,
    checkingVerification,
    login,
    register,
    logout: handleLogout,
    isAuthenticated,
    hasRole,
    refreshToken,
    checkEmailVerification,
    updateEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
