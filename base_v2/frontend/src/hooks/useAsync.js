import { useState, useCallback } from 'react';
import { showError, showSuccess } from '../utils/toastUtils';

/**
 * Custom hook to handle async operations with loading and error states
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.showSuccess - Whether to show success toast
 * @param {string} options.successMessage - Success message to show
 * @param {boolean} options.showError - Whether to show error toast
 * @param {Function} options.onSuccess - Callback on success
 * @param {Function} options.onError - Callback on error
 * @returns {Array} [execute, loading, error]
 */
const useAsync = (asyncFunction, options = {}) => {
  const {
    showSuccess: shouldShowSuccess = true,
    successMessage = 'Operation completed successfully',
    showError: shouldShowError = true,
    onSuccess,
    onError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      
      if (shouldShowSuccess && successMessage) {
        showSuccess(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      console.error('Async operation failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      
      setError(errorMessage);
      
      if (shouldShowError) {
        showError(errorMessage);
      }
      
      if (onError) {
        onError(err);
      }
      
      // Re-throw the error to allow for try/catch at the call site
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction, onError, onSuccess, shouldShowError, shouldShowSuccess, successMessage]);

  return [execute, { loading, error, setError }];
};

export default useAsync;
