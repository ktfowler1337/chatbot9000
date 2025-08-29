import { memo } from 'react';
import { Drawer, Box } from '@mui/material';
import type { Conversation } from '../types';
import { APP_CONFIG, UI_MESSAGES } from '../constants/app';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { ConversationList } from './sidebar/ConversationList';
import { useSidebarState } from '../hooks/useSidebarState';

interface SidebarProps {
  conversations: readonly Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClearHistory: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Memoized sidebar component - prevents re-renders when conversations list
 * hasn't changed (important for performance with large conversation lists)
 */
export const Sidebar = memo<SidebarProps>(({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onClearHistory,
  onRename,
  onDelete,
  isLoading = false,
}) => {
  const {
    editingId,
    editTitle,
    handleStartEdit,
    handleEditTitleChange,
    handleSaveEdit,
    handleCancelEdit,
    handleEditKeyPress,
    clearHistoryConfirmOpen,
    handleClearHistory,
    handleConfirmClearHistory,
    handleCancelClearHistory,
    deleteConfirmOpen,
    handleDeleteConversation,
    handleConfirmDelete,
    handleCancelDelete,
  } = useSidebarState();

  const drawer = (
    <>
      <SidebarHeader
        onNew={onNew}
        onClearHistory={handleClearHistory}
        hasConversations={conversations.length > 0}
        isLoading={isLoading}
      />

      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          isLoading={isLoading}
          editingId={editingId}
          editTitle={editTitle}
          onSelect={onSelect}
          onEdit={handleStartEdit}
          onDelete={handleDeleteConversation}
          onEditTitleChange={handleEditTitleChange}
          onSaveEdit={() => handleSaveEdit(onRename)}
          onCancelEdit={handleCancelEdit}
          onEditKeyPress={(e) => handleEditKeyPress(e, onRename)}
        />
      </Box>
    </>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            width: APP_CONFIG.SIDEBAR_WIDTH, 
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={clearHistoryConfirmOpen}
        title={UI_MESSAGES.CLEAR_HISTORY_CONFIRM_TITLE}
        message={UI_MESSAGES.CLEAR_HISTORY_CONFIRM_MESSAGE}
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={() => handleConfirmClearHistory(onClearHistory)}
        onCancel={handleCancelClearHistory}
        isDestructive={true}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        title={UI_MESSAGES.DELETE_CONVERSATION_CONFIRM_TITLE}
        message={UI_MESSAGES.DELETE_CONVERSATION_CONFIRM_MESSAGE}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => handleConfirmDelete(onDelete)}
        onCancel={handleCancelDelete}
        isDestructive={true}
      />
    </>
  );
});

Sidebar.displayName = 'Sidebar';

Sidebar.displayName = 'Sidebar';
