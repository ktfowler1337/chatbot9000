import { memo, useCallback, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Box,
  Tooltip,
  CircularProgress,
  Typography,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  DeleteSweep as DeleteSweepIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { SidebarProps } from '../types';
import { APP_CONFIG, UI_MESSAGES } from '../constants/app';
import { getRelativeTimeString } from '../utils/date';
import { validateConversationTitle, sanitizeInput } from '../utils/common';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * Memoized sidebar component for conversation management
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [clearHistoryConfirmOpen, setClearHistoryConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  const handleNew = useCallback(() => {
    onNew();
  }, [onNew]);

  const handleClearHistory = useCallback(() => {
    setClearHistoryConfirmOpen(true);
  }, []);

  const handleConfirmClearHistory = useCallback(() => {
    onClearHistory();
    setClearHistoryConfirmOpen(false);
  }, [onClearHistory]);

  const handleCancelClearHistory = useCallback(() => {
    setClearHistoryConfirmOpen(false);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversationToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (conversationToDelete) {
      onDelete(conversationToDelete);
      setConversationToDelete(null);
      setDeleteConfirmOpen(false);
    }
  }, [conversationToDelete, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setConversationToDelete(null);
    setDeleteConfirmOpen(false);
  }, []);

  const handleStartEdit = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editTitle.trim()) {
      const sanitizedTitle = sanitizeInput(editTitle);
      if (validateConversationTitle(sanitizedTitle)) {
        onRename(editingId, sanitizedTitle);
        setEditingId(null);
        setEditTitle('');
      }
    }
  }, [editingId, editTitle, onRename]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const handleEditKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const drawer = (
    <>
      {/* Header with new chat button and clear history */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ListItem disablePadding sx={{ flex: 1 }}>
            <ListItemButton
              onClick={handleNew}
              disabled={isLoading}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="New Chat" />
            </ListItemButton>
          </ListItem>
          
          {conversations.length > 0 && (
            <Tooltip title={UI_MESSAGES.CLEAR_HISTORY_TOOLTIP}>
              <IconButton 
                onClick={handleClearHistory}
                disabled={isLoading}
                color="inherit"
                size="large"
                sx={{ ml: 1 }}
              >
                <DeleteSweepIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Divider />
      </Box>

      {/* Conversations list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.map((conv) => (
              <ListItem key={conv.id} disablePadding sx={{ mb: 0.5 }}>
                {editingId === conv.id ? (
                  // Edit mode
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
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={handleEditKeyPress}
                      size="small"
                      variant="outlined"
                      autoFocus
                      fullWidth
                      placeholder="Enter conversation title..."
                      error={editTitle.length > 0 && !validateConversationTitle(editTitle)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleSaveEdit}
                      disabled={!validateConversationTitle(editTitle)}
                      color="primary"
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCancelEdit}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  // Normal mode
                  <ListItemButton
                    selected={conv.id === selectedId}
                    onClick={() => handleSelect(conv.id)}
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
                            fontWeight: conv.id === selectedId ? 600 : 400,
                          }}
                        >
                          {conv.title}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            color: conv.id === selectedId ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                          }}
                        >
                          {getRelativeTimeString(conv.updatedAt)}
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
                            handleStartEdit(conv.id, conv.title);
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
                            handleDeleteConversation(conv.id);
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
                )}
              </ListItem>
            ))}
          </List>
        )}
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
        onConfirm={handleConfirmClearHistory}
        onCancel={handleCancelClearHistory}
        isDestructive={true}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        title={UI_MESSAGES.DELETE_CONVERSATION_CONFIRM_TITLE}
        message={UI_MESSAGES.DELETE_CONVERSATION_CONFIRM_MESSAGE}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive={true}
      />
    </>
  );
});

Sidebar.displayName = 'Sidebar';
