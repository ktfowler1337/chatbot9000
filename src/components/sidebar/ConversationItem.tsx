import { ListItemButton, ListItemIcon, ListItemText, IconButton, Box, Tooltip, Typography } from '@mui/material';
import { Chat as ChatIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Conversation } from '../../types';
import { getRelativeTimeString } from '../../utils/date';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export const ConversationItem = ({
  conversation,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: ConversationItemProps) => {
  return (
    <ListItemButton
      selected={isSelected}
      onClick={() => onSelect(conversation.id)}
      sx={{ 
        borderRadius: 1,
        pr: 0.5,
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <ChatIcon />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography
            variant="body2"
            noWrap
            sx={{ 
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            {conversation.title}
          </Typography>
        }
        secondary={
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              color: isSelected ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
            }}
          >
            {getRelativeTimeString(conversation.updatedAt)}
          </Typography>
        }
      />
      <Box sx={{ 
        display: 'flex', 
        gap: 0.5,
        opacity: 0.7,
        transition: 'opacity 0.2s',
        '.MuiListItemButton-root:hover &': {
          opacity: 1,
        },
      }}>
        <Tooltip title="Rename conversation">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(conversation.id, conversation.title);
            }}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete conversation">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            sx={{
              '&:hover': {
                bgcolor: 'error.main',
                color: 'error.contrastText',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </ListItemButton>
  );
};
