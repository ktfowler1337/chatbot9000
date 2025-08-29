import { Box, Typography } from '@mui/material';
import { UI_MESSAGES } from '../constants/app';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Reusable empty state component
 */
export const EmptyState = ({ 
  message = UI_MESSAGES.NO_CONVERSATION_SELECTED,
  icon,
  action 
}: EmptyStateProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'text.secondary',
      p: 3,
      textAlign: 'center',
      gap: 2,
    }}
  >
    {icon && (
      <Box sx={{ fontSize: 48, opacity: 0.5 }}>
        {icon}
      </Box>
    )}
    <Typography variant="h6" component="div">
      {message}
    </Typography>
    {action && (
      <Box sx={{ mt: 2 }}>
        {action}
      </Box>
    )}
  </Box>
);
