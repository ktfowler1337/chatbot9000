import { useState, useCallback } from 'react';
import { validateConversationTitle, sanitizeInput } from '../utils/common';

export const useSidebarState = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [clearHistoryConfirmOpen, setClearHistoryConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleStartEdit = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  }, []);

  const handleEditTitleChange = useCallback((title: string) => {
    setEditTitle(title);
  }, []);

  const handleSaveEdit = useCallback((onRename: (id: string, title: string) => void) => {
    if (editingId && editTitle.trim()) {
      const sanitizedTitle = sanitizeInput(editTitle);
      if (validateConversationTitle(sanitizedTitle)) {
        onRename(editingId, sanitizedTitle);
        setEditingId(null);
        setEditTitle('');
      }
    }
  }, [editingId, editTitle]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const handleEditKeyPress = useCallback((e: React.KeyboardEvent, onRename: (id: string, title: string) => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(onRename);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleClearHistory = useCallback(() => {
    setClearHistoryConfirmOpen(true);
  }, []);

  const handleConfirmClearHistory = useCallback((onClearHistory: () => void) => {
    onClearHistory();
    setClearHistoryConfirmOpen(false);
  }, []);

  const handleCancelClearHistory = useCallback(() => {
    setClearHistoryConfirmOpen(false);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversationToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback((onDelete: (id: string) => void) => {
    if (conversationToDelete) {
      onDelete(conversationToDelete);
      setConversationToDelete(null);
      setDeleteConfirmOpen(false);
    }
  }, [conversationToDelete]);

  const handleCancelDelete = useCallback(() => {
    setConversationToDelete(null);
    setDeleteConfirmOpen(false);
  }, []);

  return {
    // Edit state
    editingId,
    editTitle,
    handleStartEdit,
    handleEditTitleChange,
    handleSaveEdit,
    handleCancelEdit,
    handleEditKeyPress,
    
    // Clear history state
    clearHistoryConfirmOpen,
    handleClearHistory,
    handleConfirmClearHistory,
    handleCancelClearHistory,
    
    // Delete state
    deleteConfirmOpen,
    conversationToDelete,
    handleDeleteConversation,
    handleConfirmDelete,
    handleCancelDelete,
  };
}

export default useSidebarState;
