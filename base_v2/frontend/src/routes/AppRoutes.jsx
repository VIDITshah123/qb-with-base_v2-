import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MainLayout from '../components/layout/MainLayout';
import { toast } from 'react-toastify';

// Lazy load route components
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const QuestionsPage = lazy(() => import('../pages/QuestionsPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
import EmployeeRoutes from './employeeRoutes';
import ReviewDashboard from '../components/reviews/ReviewDashboard';
const NotFoundPage = lazy(() => import('../pages/error/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/error/UnauthorizedPage'));

// List of routes that don't require email verification
const publicRoutes = ['/verify-email', '/login', '/register', '/forgot-password', '/reset-password'];

const AppRoutes = () => {
  const { isAuthenticated, hasRole, isEmailVerified, checkingVerification } = useAuth();
  const location = useLocation();

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  // Check if email is verified for protected routes
  useEffect(() => {
    const checkVerification = async () => {
      if (isAuthenticated() && !isPublicRoute && !checkingVerification && !isEmailVerified) {
        toast.warning('Please verify your email address to access all features', {
          toastId: 'email-verification-warning',
          autoClose: 10000
        });
      }
    };

    checkVerification();
  }, [isAuthenticated, isEmailVerified, isPublicRoute, checkingVerification]);

  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } />
        <Route path="/forgot-password" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />
        } />
        <Route path="/reset-password" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />
        } />
        <Route path="/verify-email/:token?" element={
          isAuthenticated() ? <VerifyEmailPage /> : <Navigate to="/login" state={{ from: location }} replace />
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute requireEmailVerification={true}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* User Routes */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="questions/*" element={<QuestionsPage />} />
          <Route path="reviews" element={
            <ProtectedRoute roles={['admin', 'reviewer']}>
              <ReviewDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="admin/companies/:companyId/employees/*" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <EmployeeRoutes />
            </ProtectedRoute>
          } />
        </Route>

        {/* Error Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
