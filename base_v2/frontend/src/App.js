import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
 

// Layout Components
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
 

// Authentication Components
import Login from './components/authentication/Login';
import Register from './components/authentication/Register';
import ForgotPassword from './components/authentication/ForgotPassword';
import ResetPassword from './components/authentication/ResetPassword';
import Unauthorized from './components/common/Unauthorized';

// Dashboard Components
import Dashboard from './components/dashboard/Dashboard';
import RoleDashboard from './components/dashboard/RoleDashboard';

// User Management Components
import UserList from './components/users/UserList';
import UserDetails from './components/users/UserDetails';
import UserCreate from './components/users/UserCreate';
import UserEdit from './components/users/UserEdit';
import UserBulkUpload from './components/users/UserBulkUpload';
import UserProfile from './components/users/UserProfile';

// Role Management Components
import RoleList from './components/roles/RoleList';
import FeatureToggleList from './components/feature/FeatureToggleList';
import RoleDetails from './components/roles/RoleDetails';
import RoleCreate from './components/roles/RoleCreate';
import RoleEdit from './components/roles/RoleEdit';
import RoleBulkUpload from './components/roles/RoleBulkUpload';

// Permission Management Components
import PermissionList from './components/permissions/PermissionList';
import PermissionDetails from './components/permissions/PermissionDetails';
import PermissionCreate from './components/permissions/PermissionCreate';
import PermissionEdit from './components/permissions/PermissionEdit';

// Logging Components
import ActivityLogs from './components/logging/ActivityLogs';
import PricingPage from './components/pricing/PricingPage';

// Payment Components
import PaymentAdmin from './pages/admin/PaymentAdmin';
import FileUploadConfig from './components/fileupload/FileUploadConfig';
import FeatureRequestPage from './pages/FeatureRequestPage';
import FeatureRequestAdminPage from './pages/admin/FeatureRequestAdminPage';


// Common Components


function App() {
  const { isAuthenticated, isLoading, roles } = useAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Simplified withFeatureRoute function to avoid navigation issues
  // For now, we're using just the ProtectedRoute with role checks
  // We'll reimplement feature toggles gradually after fixing navigation
  const withFeatureRoute = (Component, featureName, permission = 'view', allowedRoles = []) => {
    // For now, use standard role-based protection for all routes
    // This ensures pages load correctly while we debug feature toggle API issues
    return <ProtectedRoute element={<Component />} allowedRoles={allowedRoles} />;
  };
  
  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes */}
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="payment-admin" element={
            <ProtectedRoute element={<PaymentAdmin />} allowedRoles={['admin']} />
          } />
          
                    <Route index element={<Navigate to={roles && roles.length > 0 ? `/dashboard/${roles[0].toLowerCase()}` : '/dashboard'} />} />
          <Route path="dashboard" element={withFeatureRoute(Dashboard, 'dashboard', 'view')} />
          <Route path="dashboard/:roleName" element={<ProtectedRoute element={<RoleDashboard />} />} />
          
          {/* User Management Routes */}
          <Route path="users">
            <Route index element={withFeatureRoute(UserList, 'users_list', 'view')} />
            <Route path=":id" element={<ProtectedRoute element={<UserDetails />} />} />
            <Route path="profile/:userId" element={<ProtectedRoute element={<UserProfile />} />} />
            <Route path="create" element={<ProtectedRoute element={<UserCreate />} allowedRoles={['admin']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<UserEdit />} allowedRoles={['admin']} />} />
            <Route path="bulk-upload" element={<ProtectedRoute element={<UserBulkUpload />} allowedRoles={['admin']} />} />
          </Route>
          
          {/* Role Management Routes */}
          <Route path="roles">
            <Route index element={withFeatureRoute(RoleList, 'roles_list', 'view')} />
            <Route path=":id" element={<ProtectedRoute element={<RoleDetails />} />} />
            <Route path="create" element={<ProtectedRoute element={<RoleCreate />} allowedRoles={['admin']} />} />
            <Route path="feature-toggles" element={<ProtectedRoute element={<FeatureToggleList />} allowedRoles={['admin', 'full_access']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<RoleEdit />} allowedRoles={['admin']} />} />
            <Route path="bulk-upload" element={<ProtectedRoute element={<RoleBulkUpload />} allowedRoles={['admin']} />} />
          </Route>
          
          {/* Permission Management Routes */}
          <Route path="permissions">
            <Route index element={<ProtectedRoute element={<PermissionList />} />} />
            <Route path=":id" element={<ProtectedRoute element={<PermissionDetails />} />} />
            <Route path="create" element={<ProtectedRoute element={<PermissionCreate />} allowedRoles={['admin']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<PermissionEdit />} allowedRoles={['admin']} />} />
          </Route>
          
          {/* Logging Routes */}
          <Route path="logs" element={<ProtectedRoute element={<ActivityLogs />} />} />

          {/* Pricing Route */}
          <Route path="pricing" element={<ProtectedRoute element={<PricingPage />} />} />
          
          {/* Payment Routes */}
          <Route path="payment" element={<ProtectedRoute element={<PaymentAdmin />} allowedRoles={['admin']} />} />

          {/* File Upload Widget Routes */}
          <Route path="admin/file-upload-settings" element={<ProtectedRoute element={<FileUploadConfig />} allowedRoles={['admin']} />} />

          {/* Feature Request Route */}
          <Route path="feature-requests/new" element={<ProtectedRoute element={<FeatureRequestPage />} />} />
          <Route path="admin/feature-requests" element={<ProtectedRoute element={<FeatureRequestAdminPage />} allowedRoles={['admin']} />} />
        </Route>
        
        {/* Catch All Route */}
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </React.Fragment>
  );
}

export default App;
