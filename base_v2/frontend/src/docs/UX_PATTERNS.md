# UX Patterns and Best Practices

This document outlines the UX patterns and best practices used throughout the application to ensure a consistent and user-friendly experience.

## Table of Contents
1. [Loading States](#loading-states)
2. [Error Handling](#error-handling)
3. [Form Validation](#form-validation)
4. [Toast Notifications](#toast-notifications)
5. [API Integration](#api-integration)
6. [Component Guidelines](#component-guidelines)

## Loading States

### When to Use
- Data fetching operations
- Form submissions
- File uploads/downloads
- Any operation that might take more than 200ms

### Implementation

#### Using `useAsync` Hook
```jsx
import useAsync from '../hooks/useAsync';

const MyComponent = () => {
  const [fetchData, { loading, error }] = useAsync(
    async (params) => {
      const response = await api.get('/endpoint', { params });
      return response.data;
    },
    {
      showSuccess: true,
      successMessage: 'Data loaded successfully',
      onSuccess: (data) => {
        // Handle successful data fetch
      },
      onError: (error) => {
        // Handle error (optional, errors are shown by default)
      },
    }
  );

  return (
    <>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      <button onClick={() => fetchData({ param: 'value' })} disabled={loading}>
        {loading ? 'Loading...' : 'Load Data'}
      </button>
    </>
  );
};
```

#### Using `LoadingSpinner` Component
```jsx
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Full page loading
<LoadingSpinner fullScreen />

// Inline loading
<LoadingSpinner size={24} />
```

## Error Handling

### Error Boundary
Wrap components that might throw errors with the `ErrorBoundary` component:

```jsx
import ErrorBoundary from '../components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}
```

### Error Messages
Use the `ErrorMessage` component to display errors to users:

```jsx
import { Alert } from '@mui/material';

const ErrorMessage = ({ message, onRetry }) => (
  <Alert 
    severity="error" 
    action={
      onRetry && (
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      )
    }
  >
    {message}
  </Alert>
);
```

## Form Validation

### Using Formik with Yup

```jsx
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { validationSchemas } from '../utils/validationSchemas';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Required'),
  password: Yup.string()
    .min(8, 'Must be at least 8 characters')
    .required('Required'),
});

const LoginForm = () => (
  <Formik
    initialValues={{ email: '', password: '' }}
    validationSchema={validationSchema}
    onSubmit={(values, { setSubmitting }) => {
      // Handle form submission
    }}
  >
    {({ errors, touched, isSubmitting }) => (
      <Form>
        <Field name="email" type="email" />
        {touched.email && errors.email && <div>{errors.email}</div>}
        
        <Field name="password" type="password" />
        {touched.password && errors.password && <div>{errors.password}</div>}
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </Form>
    )}
  </Formik>
);
```

## Toast Notifications

### Basic Usage
```jsx
import { showSuccess, showError, showWarning, showInfo } from '../utils/toastUtils';

// Success message
showSuccess('Operation completed successfully!');

// Error message
showError('An error occurred. Please try again.');

// Warning message
showWarning('This action cannot be undone.');

// Info message
showInfo('Your changes have been saved.');
```

### Loading Toast
```jsx
import { showLoading, updateToast } from '../utils/toastUtils';

const handleSubmit = async () => {
  const toastId = showLoading('Processing...');
  
  try {
    await someAsyncOperation();
    updateToast(toastId, 'success', 'Operation completed successfully!');
  } catch (error) {
    updateToast(toastId, 'error', 'Failed to complete operation.');
  }
};
```

## API Integration

### Using `useAsync` for API Calls
```jsx
import useAsync from '../hooks/useAsync';
import api from '../utils/api';

const UserProfile = ({ userId }) => {
  const [fetchUser, { data: user, loading, error }] = useAsync(
    async (id) => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    {
      showSuccess: false,
      showError: true,
    }
  );

  useEffect(() => {
    fetchUser(userId);
  }, [fetchUser, userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchUser(userId)} />;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
};
```

## Component Guidelines

### Button States
- Use `disabled` prop for loading/processing states
- Show loading spinners for operations > 200ms
- Provide visual feedback on click

### Form Controls
- Show validation errors after first submission attempt
- Mark required fields with an asterisk (*)
- Group related fields together

### Data Display
- Show loading states for data fetching
- Handle empty states gracefully
- Provide pagination for large datasets

### Accessibility
- Use semantic HTML elements
- Add proper ARIA attributes
- Ensure keyboard navigation works
- Provide text alternatives for non-text content

## Best Practices

1. **Consistency**
   - Use the same patterns and components throughout the app
   - Maintain consistent spacing, typography, and colors

2. **Feedback**
   - Always provide feedback for user actions
   - Use toast notifications for global messages
   - Show inline validation for forms

3. **Performance**
   - Lazy load components when possible
   - Optimize images and assets
   - Use pagination or infinite scroll for large datasets

4. **Error Prevention**
   - Use confirmation dialogs for destructive actions
   - Validate input before submission
   - Provide clear error messages

5. **Mobile Responsiveness**
   - Design for mobile-first
   - Test on various screen sizes
   - Use responsive layouts and components
