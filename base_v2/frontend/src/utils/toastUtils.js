import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast configuration
toast.configure({
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
});

// Success toast
export const showSuccess = (message) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Error toast
export const showError = (message) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Warning toast
export const showWarning = (message) => {
  toast.warn(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Info toast
export const showInfo = (message) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Loading toast
export const showLoading = (message) => {
  return toast.loading(message, {
    position: 'top-right',
    autoClose: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
  });
};

// Update existing toast
export const updateToast = (toastId, type, message) => {
  if (toast.isActive(toastId)) {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      autoClose: 3000,
      closeButton: true,
    });
  }
};

// Dismiss toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  update: updateToast,
  dismiss: dismissToast,
};
