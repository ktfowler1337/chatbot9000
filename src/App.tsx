import { useState, useCallback, Suspense, lazy } from 'react';
import { ThemeProvider, CssBaseline, Box, Alert, CircularProgress } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import { QueryProvider } from './providers/QueryProvider';
import { useChatStore } from './store/chatStore';
import { useAISendMessage } from './hooks/useAISendMessage';
import { APP_CONFIG, UI_MESSAGES } from './constants/app';
import type { Message } from './types';

// Lazy load heavy components
const Sidebar = lazy(() => import('./components/Sidebar').then(module => ({ default: module.Sidebar })));
const ChatWindow = lazy(() => import('./components/ChatWindow').then(module => ({ default: module.ChatWindow })));

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    height="100vh"
    bgcolor="background.default"
  >
    <CircularProgress />
  </Box>
);

/**
 * Main application content component
 */
function AppContent() {
  const [selectedId, setSelectedId] = useState<string>();
  
  const { 
    conversations, 
    isLoading: storeLoading, 
    error: storeError,
    createConversation,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    clearHistory,
    removeMessage
  } = useChatStore();

  // Get the selected conversation from the conversations list (where optimistic updates happen)
  const selectedConversation = selectedId ? conversations.find(conv => conv.id === selectedId) : undefined;

  // AI message sending with React Query for backend calls
  const { 
    sendMessage: sendToAI, 
    isPending: isSending,
    error: sendError 
  } = useAISendMessage(
    // On user message - add to conversation
    async (userMessage: Message) => {
      if (selectedConversation) {
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, userMessage],
          updatedAt: new Date()
        };
        await updateConversation(updatedConversation);
      }
    },
    // On AI response - add to conversation
    async (aiMessage: Message) => {
      if (selectedConversation) {
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, aiMessage],
          updatedAt: new Date()
        };
        await updateConversation(updatedConversation);
      }
    },
    // On error - remove the failed user message
    async (messageId: string) => {
      if (selectedConversation) {
        await removeMessage(selectedConversation.id, messageId);
      }
    }
  );

  const handleNewChat = useCallback(async () => {
    try {
      const newConversation = await createConversation();
      setSelectedId(newConversation.id);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [createConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedId || !selectedConversation) {
      // If no conversation is selected, create a new one with this message
      try {
        const newConversation = await createConversation(content);
        setSelectedId(newConversation.id);
        // Send the message to AI after creating conversation
        sendToAI(content);
      } catch (error) {
        console.error('Failed to create conversation with message:', error);
      }
      return;
    }
    sendToAI(content);
  }, [selectedId, selectedConversation, sendToAI, createConversation]);

  const handleClearHistory = useCallback(async () => {
    setSelectedId(undefined);
    await clearHistory();
  }, [clearHistory]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    await updateConversationTitle(id, newTitle);
  }, [updateConversationTitle]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    // If the deleted conversation is currently selected, clear selection
    if (selectedId === id) {
      setSelectedId(undefined);
    }
    await deleteConversation(id);
  }, [deleteConversation, selectedId]);

  // Combine error states - only store errors, not send errors (those are handled in ChatWindow)
  const error = storeError;
  const isLoading = storeLoading || isSending;

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
          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>
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
            <Suspense fallback={<LoadingFallback />}>
              <ChatWindow
                messages={selectedConversation?.messages || []}
                onSend={handleSendMessage}
                isLoading={isLoading}
                error={sendError?.message || null}
              />
            </Suspense>
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