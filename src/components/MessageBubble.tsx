import { memo } from 'react';
import { Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { MessageBubbleProps } from '../types';
import { formatTimestamp } from '../utils/date';
import { APP_CONFIG } from '../constants/app';

/**
 * Memoized message bubble component for optimal rendering performance
 */
export const MessageBubble = memo<MessageBubbleProps>(({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: APP_CONFIG.ANIMATION_DURATION }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: APP_CONFIG.MAX_MESSAGE_WIDTH,
          p: 2,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          borderRadius: 2,
          borderTopRightRadius: isUser ? 0 : 2,
          borderTopLeftRadius: isUser ? 2 : 0,
        }}
      >
        <Typography
          variant="body1"
          component="div"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            '& code': {
              bgcolor: 'rgba(0, 0, 0, 0.1)',
              p: 0.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
            '& pre': {
              bgcolor: 'rgba(0, 0, 0, 0.05)',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
            },
          }}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: 'block',
            color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {formatTimestamp(message.timestamp)}
        </Typography>
      </Paper>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';
