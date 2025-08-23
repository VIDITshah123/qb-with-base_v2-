import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi';
import authService from '../../services/authService';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'already-verified'
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // If user is already verified and logged in
        if (currentUser?.isEmailVerified) {
          setStatus('already-verified');
          return;
        }

        if (!token) {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        await authService.verifyEmail(token);
        setStatus('success');
        
        // Update user context if logged in
        if (currentUser) {
          currentUser.isEmailVerified = true;
        }
      } catch (err) {
        console.error('Email verification error:', err);
        setStatus('error');
        setError(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token, currentUser]);

  const handleResendVerification = async () => {
    try {
      setStatus('verifying');
      await authService.resendVerificationEmail();
      setStatus('resent');
    } catch (err) {
      console.error('Resend verification error:', err);
      setError(err.response?.data?.message || 'Failed to resend verification email');
      setStatus('error');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <FiMail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verifying your email...
          </h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            <p>Please wait while we verify your email address.</p>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success' || status === 'already-verified') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status === 'success' ? 'Email Verified!' : 'Email Already Verified'}
          </h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            <p className="mb-4">
              {status === 'success'
                ? 'Your email has been successfully verified. You can now access all features.'
                : 'Your email is already verified. You have full access to your account.'}
            </p>
            <Link
              to="/dashboard"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'resent') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <FiMail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verification Email Sent
          </h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            <p className="mb-4">
              We've sent a new verification email to your address. Please check your inbox and click the verification link.
            </p>
            <div className="mt-4">
              <button
                onClick={handleResendVerification}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Didn't receive it? Send again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <FiXCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verification Failed
        </h2>
        <div className="mt-2 text-center text-sm text-gray-600">
          <p className="text-red-600 mb-4">{error}</p>
          {currentUser ? (
            <div>
              <button
                onClick={handleResendVerification}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Resend Verification Email
              </button>
              <p className="mt-2">
                <Link to="/profile" className="text-blue-600 hover:text-blue-500">
                  Go to Profile →
                </Link>
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-2">Please log in to request a new verification email.</p>
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Go to Login →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
