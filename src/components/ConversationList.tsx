import { Box, List, ListItem, CircularProgress, Typography } from '@mui/material';
import type { Conversation } from '../types';
import { ConversationItem } from './ConversationItem';
import { ConversationEditor } from './ConversationEditor';

interface ConversationListProps {
  conversations: readonly Conversation[];
  selectedId?: string;
  isLoading: boolean;
  editingId: string | null;
  editTitle: string;
  onSelect: (id: string) => void;
  onEdit: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
  onEditTitleChange: (title: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const ConversationList = ({
  conversations,
  selectedId,
  isLoading,
  editingId,
  editTitle,
  onSelect,
  onEdit,
  onDelete,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
}: ConversationListProps) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No conversations yet
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {conversations.map((conv) => (
        <ListItem key={conv.id} disablePadding sx={{ mb: 0.5 }}>
          {editingId === conv.id ? (
            <ConversationEditor
              value={editTitle}
              onChange={onEditTitleChange}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <ConversationItem
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </ListItem>
      ))}
    </List>
  );
};
