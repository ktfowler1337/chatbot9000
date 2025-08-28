import { Box, keyframes } from '@mui/material';

const dotAnimation = keyframes`
  0% { 
    opacity: 0.2; 
    transform: scale(0.8);
  }
  20% { 
    opacity: 1; 
    transform: scale(1);
  }
  100% { 
    opacity: 0.2; 
    transform: scale(0.8);
  }
`;

/**
 * Loading dots component for indicating AI response generation
 */
export const LoadingDots = () => (
  <Box 
    sx={{ 
      display: 'inline-flex', 
      gap: '4px',
      alignItems: 'center',
    }}
    role="status"
    aria-label="AI is generating response"
  >
    {[0, 1, 2].map((index) => (
      <Box
        key={index}
        component="span"
        sx={{
          animation: `${dotAnimation} 1.4s infinite ease-in-out`,
          animationDelay: `${index * 0.2}s`,
          fontSize: '1.2em',
          lineHeight: 1,
          color: 'text.secondary',
          display: 'inline-block',
        }}
      >
        •
      </Box>
    ))}
  </Box>
);
