import { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, Alert } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { QueryProvider } from './providers/QueryProvider';
import { useChatStore } from './store/chatStore';
import { useSendMessage, useCreateConversation } from './hooks/useChat';
import { APP_CONFIG, UI_MESSAGES } from './constants/app';

/**
 * Main application content component
 */
function AppContent() {
  const [selectedId, setSelectedId] = useState<string>();
  
  const { 
    conversations, 
    isLoading: storeLoading, 
    error: storeError,
    updateConversationTitle,
    deleteConversation,
    clearHistory 
  } = useChatStore();
  
  const { 
    mutate: sendChatMessage, 
    isPending: isSending,
    error: sendError 
  } = useSendMessage(selectedId || '');

  const { 
    mutate: createConversation, 
    isPending: isCreating 
  } = useCreateConversation();

  // Get the selected conversation from the conversations list (where optimistic updates happen)
  const selectedConversation = selectedId ? conversations.find(conv => conv.id === selectedId) : undefined;

  const handleNewChat = useCallback(() => {
    createConversation(undefined, {
      onSuccess: (newConversation) => {
        setSelectedId(newConversation.id);
      },
      onError: (error) => {
        console.error('Failed to create new conversation:', error);
      }
    });
  }, [createConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!selectedId || !selectedConversation) {
      // If no conversation is selected, create a new one with this message
      createConversation(content, {
        onSuccess: (newConversation) => {
          setSelectedId(newConversation.id);
        },
        onError: (error) => {
          console.error('Failed to create conversation with message:', error);
        }
      });
      return;
    }
    sendChatMessage(content);
  }, [selectedId, selectedConversation, sendChatMessage, createConversation]);

  const handleClearHistory = useCallback(() => {
    setSelectedId(undefined);
    clearHistory();
  }, [clearHistory]);

  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    updateConversationTitle(id, newTitle);
  }, [updateConversationTitle]);

  const handleDeleteConversation = useCallback((id: string) => {
    // If the deleted conversation is currently selected, clear selection
    if (selectedId === id) {
      setSelectedId(undefined);
    }
    deleteConversation(id);
  }, [deleteConversation, selectedId]);

  // Combine error states
  const error = storeError || (sendError ? sendError.message : null);
  const isLoading = storeLoading || isSending || isCreating;

  // Show chat window if we have a selected conversation
  const showChatWindow = !!selectedConversation;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden' 
      }}>
        {/* Sidebar */}
        <Box sx={{ 
          width: APP_CONFIG.SIDEBAR_WIDTH, 
          flexShrink: 0, 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <Sidebar
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            onNew={handleNewChat}
            onClearHistory={handleClearHistory}
            onRename={handleRenameConversation}
            onDelete={handleDeleteConversation}
            isLoading={storeLoading}
          />
        </Box>

        {/* Main content area */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Global error display */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 1000 
              }}
            >
              {error}
            </Alert>
          )}

          {showChatWindow ? (
            <ChatWindow
              messages={selectedConversation?.messages || []}
              onSend={handleSendMessage}
              isLoading={isLoading}
              error={sendError?.message || null}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
                p: 3,
                textAlign: 'center',
              }}
            >
              {UI_MESSAGES.NO_CONVERSATION_SELECTED}
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

/**
 * Root application component with providers
 */
export default function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}