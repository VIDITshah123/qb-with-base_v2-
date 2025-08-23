import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiLock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const UnauthorizedPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <FiLock className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Access Denied
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          {isAuthenticated()
            ? "You don't have permission to access this page."
            : 'Please sign in to access this page.'}
        </p>
        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          {isAuthenticated() ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiHome className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Go back
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                state={{ from: window.location.pathname }}
              >
                Sign in
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiHome className="mr-2 h-4 w-4" />
                Go to home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
