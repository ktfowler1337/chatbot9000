import { memo, useRef, useState, type KeyboardEvent } from 'react';
import { Paper, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';
import { validateMessage, sanitizeInput } from '../utils/common';

interface InputBarProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

/**
 * Memoized input bar component - prevents re-renders when parent state changes
 * but props remain the same (important for typing performance)
 */
export const InputBar = memo<InputBarProps>(({ 
  onSend, 
  isLoading = false,
  placeholder = "Type your message..." 
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const sanitized = sanitizeInput(input);
    
    if (validateMessage(sanitized) && !isLoading) {
      setInput('');
      onSend(sanitized);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();

      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

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
