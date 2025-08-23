import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

/**
 * ProtectedRoute component that redirects to login if user is not authenticated
 * or to unauthorized page if user doesn't have required role
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if user is authorized
 * @param {string[]} [props.roles] - Array of allowed roles. If not provided, any authenticated user can access
 * @param {boolean} [props.requireEmailVerification] - Whether email verification is required (default: false)
 * @param {string} [props.redirectTo] - Path to redirect if user is not authorized (default: '/login')
 * @param {string} [props.unauthorizedRedirectTo] - Path to redirect if user doesn't have required role (default: '/unauthorized')
 * @param {string} [props.unverifiedRedirectTo] - Path to redirect if email is not verified (default: '/verify-email')
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({
  children,
  roles = [],
  requireEmailVerification = false,
  redirectTo = '/login',
  unauthorizedRedirectTo = '/unauthorized',
  unverifiedRedirectTo = '/verify-email',
  ...rest
}) => {
  const { 
    isAuthenticated, 
    user, 
    loading, 
    isEmailVerified, 
    checkingVerification 
  } = useAuth();
  const location = useLocation();
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  // Check email verification status if required
  useEffect(() => {
    const checkVerification = async () => {
      if (isAuthenticated() && requireEmailVerification && !checkingVerification) {
        if (!isEmailVerified) {
          setShowVerificationBanner(true);
          
          // Show toast notification if user is already on the verification page
          if (location.pathname !== unverifiedRedirectTo) {
            toast.warning('Please verify your email address to access all features', {
              toastId: 'email-verification-required',
              autoClose: 10000
            });
          }
        }
        setVerificationChecked(true);
      }
    };

    checkVerification();
  }, [isAuthenticated, isEmailVerified, checkingVerification, requireEmailVerification, location.pathname, unverifiedRedirectTo]);

  // Show loading indicator while checking auth status or verification
  if (loading || (requireEmailVerification && !verificationChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If email verification is required but email is not verified
  if (requireEmailVerification && !isEmailVerified) {
    // Don't redirect if already on the verification page to avoid infinite loop
    if (location.pathname !== unverifiedRedirectTo) {
      return <Navigate to={unverifiedRedirectTo} state={{ from: location }} replace />;
    }
  }

  // If roles are specified, check if user has any of the required roles
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => user?.roles?.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to={unauthorizedRedirectTo} state={{ from: location }} replace />;
    }
  }

  // If user is authenticated and has required role, render children with verification banner if needed
  return (
    <div className="flex flex-col min-h-screen">
      {showVerificationBanner && !location.pathname.startsWith('/verify-email') && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please verify your email address to access all features. 
                <a 
                  href="/verify-email" 
                  className="font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  Click here to verify your email
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default ProtectedRoute;
