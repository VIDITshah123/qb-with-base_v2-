import React, { Component } from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { BugReport as BugReportIcon } from '@mui/icons-material';
import { showError } from '../../utils/toastUtils';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      hasError: true
    });
    
    // Show error toast
    showError('An unexpected error occurred. Please try again later.');
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 3
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              width: '100%',
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <BugReportIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Oops! Something went wrong.
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              We're sorry, but an unexpected error has occurred. Our team has been notified.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem'
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="caption" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error && this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Component Stack:
                    </Typography>
                    <Typography variant="caption" component="div" sx={{ whiteSpace: 'pre' }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              sx={{ mt: 3 }}
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ mt: 3, ml: 2 }}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
