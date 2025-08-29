import { Box, CircularProgress } from '@mui/material';

interface LoadingFallbackProps {
  height?: string | number;
  message?: string;
}

/**
 * Reusable loading fallback component for Suspense boundaries
 */
export const LoadingFallback = ({ 
  height = '100vh', 
  message 
}: LoadingFallbackProps) => (
  <Box 
    display="flex" 
    flexDirection="column"
    justifyContent="center" 
    alignItems="center" 
    height={height}
    bgcolor="background.default"
    gap={2}
  >
    <CircularProgress />
    {message && (
      <Box 
        color="text.secondary" 
        textAlign="center"
        sx={{ mt: 1 }}
      >
        {message}
      </Box>
    )}
  </Box>
);
