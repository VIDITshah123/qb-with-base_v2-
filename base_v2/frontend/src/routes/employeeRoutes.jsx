import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmployeesPage from '../pages/admin/employees/EmployeesPage';
import EmployeeDetail from '../pages/admin/employees/EmployeeDetail';
import EmployeeForm from '../components/employees/EmployeeForm';
import LoadingSpinner from '../components/common/LoadingSpinner';

const EmployeeRoutes = () => {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // Check if user has admin or manager role
  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager';
  
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Routes>
      <Route index element={<EmployeesPage />} />
      <Route path="new" element={<EmployeeForm />} />
      <Route path=":employeeId" element={<EmployeeDetail />} />
      <Route path=":employeeId/edit" element={<EmployeeForm isEdit={true} />} />
    </Routes>
  );
};

export default EmployeeRoutes;
