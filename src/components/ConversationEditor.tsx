import { Box, TextField, IconButton } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { validateConversationTitle } from '../utils/common';

interface ConversationEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ConversationEditor = ({
  value,
  onChange,
  onSave,
  onCancel,
}: ConversationEditorProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const isValid = validateConversationTitle(value);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        p: 1,
        gap: 1,
      }}
    >
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        size="small"
        variant="outlined"
        autoFocus
        fullWidth
        placeholder="Enter conversation title..."
        error={value.length > 0 && !isValid}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
          },
        }}
      />
      <IconButton
        size="small"
        onClick={onSave}
        disabled={!isValid}
        color="primary"
      >
        <CheckIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={onCancel}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
