import { useCallback, useEffect, useRef } from 'react';
import { Box, Alert } from '@mui/material';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { LoadingDots } from './LoadingDots';
import type { Message } from '../types';
import { APP_CONFIG, UI_MESSAGES } from '../constants/app';

interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Chat window component for displaying messages and handling input
 */
export const ChatWindow = ({ 
  messages, 
  onSend, 
  isLoading = false,
  error = null 
}: ChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ 
      behavior: APP_CONFIG.SCROLL_BEHAVIOR as ScrollBehavior
    });
  }, [messages.length]);

  const handleSend = useCallback((message: string) => {
    onSend(message);
  }, [onSend]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
        }}
      >
        {/* Error display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => {/* Handle error dismissal if needed */}}
          >
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {messages.length === 0 && !error && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 3,
            }}
          >
            {UI_MESSAGES.NO_CONVERSATION_SELECTED}
          </Box>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ mt: 2, ml: 2 }}>
            <LoadingDots />
          </Box>
        )}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </Box>

      {/* Input area */}
      <InputBar onSend={handleSend} isLoading={isLoading} />
    </Box>
  );
};
