import { Alert, Button } from '@mui/material';

interface GlobalErrorAlertProps {
  error: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

/**
 * Global error alert component for displaying application-level errors
 */
export const GlobalErrorAlert = ({ 
  error, 
  onDismiss, 
  onRetry 
}: GlobalErrorAlertProps) => (
  <Alert 
    severity="error" 
    sx={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000,
      borderRadius: 0,
    }}
    onClose={onDismiss}
    action={
      onRetry && (
        <Button 
          color="inherit" 
          size="small" 
          onClick={onRetry}
        >
          Retry
        </Button>
      )
    }
  >
    {error}
  </Alert>
);
