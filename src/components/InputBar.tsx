import { memo, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { Paper, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';
import type { InputBarProps } from '../types';
import { validateMessage, sanitizeInput } from '../utils/common';

/**
 * Memoized input bar component for sending messages
 */
export const InputBar = memo<InputBarProps>(({ 
  onSend, 
  isLoading = false,
  placeholder = "Type your message..." 
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const sanitized = sanitizeInput(input);
    
    if (validateMessage(sanitized) && !isLoading) {
      setInput('');
      onSend(sanitized);
      inputRef.current?.focus();
    }
  }, [input, isLoading, onSend]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();

      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const isInputValid = validateMessage(input.trim());

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        position: 'sticky',
        bottom: 0,
        bgcolor: 'background.default',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <TextField
          multiline
          maxRows={4}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          fullWidth
          variant="outlined"
          inputRef={inputRef}
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!isInputValid || isLoading}
          color="primary"
          sx={{ p: 1 }}
          aria-label="Send message"
        >
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Send />
          )}
        </IconButton>
      </div>
    </Paper>
  );
});

InputBar.displayName = 'InputBar';
