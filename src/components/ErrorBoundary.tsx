import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Box, Alert, AlertTitle, Button, Typography, Stack } from '@mui/material';
import { Refresh as RefreshIcon, BugReport as BugReportIcon } from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'global' | 'component' | 'feature';
  name?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

/**
 * Error boundary component for catching and handling React errors
 * Provides different UI based on the error level and context
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, name = 'Unknown' } = this.props;
    
    // Log error details
    console.error(`[ErrorBoundary:${name}] Caught error:`, error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorId: this.generateErrorId(),
    });

    // Call external error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, you would send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      context: {
        level: this.props.level,
        component: this.props.name,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      errorId: this.state.errorId,
    };

    // For now, just log to console
    console.log('Error report ready for tracking service:', errorReport);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private renderErrorFallback() {
    const { level = 'component', name = 'Component', showErrorDetails = false } = this.props;
    const { error, errorId } = this.state;

    // Different UI based on error level
    switch (level) {
      case 'global':
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              p: 3,
              bgcolor: 'background.default',
            }}
          >
            <Alert severity="error" sx={{ maxWidth: 600, mb: 3 }}>
              <AlertTitle>Application Error</AlertTitle>
              <Typography variant="body1" gutterBottom>
                Something went wrong with the application. This error has been logged for investigation.
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Error ID: {errorId}
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                >
                  Reload Application
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<BugReportIcon />}
                  onClick={() => this.handleRetry()}
                >
                  Try Again
                </Button>
              </Stack>

              {showErrorDetails && error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" fontFamily="monospace">
                    {error.message}
                  </Typography>
                </Box>
              )}
            </Alert>
          </Box>
        );

      case 'feature':
        return (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={this.handleRetry}
              >
                Retry
              </Button>
            }
          >
            <AlertTitle>Feature Unavailable</AlertTitle>
            <Typography variant="body2">
              The {name} feature is temporarily unavailable. 
            </Typography>
            {showErrorDetails && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Error ID: {errorId}
              </Typography>
            )}
          </Alert>
        );

      case 'component':
      default:
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              minHeight: 200,
              border: '1px dashed',
              borderColor: 'error.main',
              borderRadius: 1,
              bgcolor: 'error.light',
              color: 'error.contrastText',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {name} Error
            </Typography>
            <Typography variant="body2" textAlign="center" gutterBottom>
              This component encountered an error and couldn't render properly.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{ mt: 1 }}
            >
              Retry Component
            </Button>
            {showErrorDetails && (
              <Typography variant="caption" sx={{ mt: 1 }}>
                ID: {errorId}
              </Typography>
            )}
          </Box>
        );
    }
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback || this.renderErrorFallback();
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook for components to manually trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    // This will trigger the nearest error boundary
    throw error;
  };
}