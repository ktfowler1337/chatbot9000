import { lazy } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatLayout } from './components/ChatLayout';
import { useConversationManager } from './hooks/useConversationManager';

// Lazy load heavy components
const Sidebar = lazy(() => import('./components/Sidebar').then(module => ({ default: module.Sidebar })));
const ChatWindow = lazy(() => import('./components/ChatWindow').then(module => ({ default: module.ChatWindow })));

/**
 * Main application content component
 */
function AppContent() {
  const {
    conversations,
    selectedId,
    selectedConversation,
    isLoading,
    error,
    sendError,
    showChatWindow,
    storeLoading,
    handleNewChat,
    handleSelectConversation,
    handleSendMessage,
    handleClearHistory,
    handleRenameConversation,
    handleDeleteConversation,
  } = useConversationManager();

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ChatLayout
        globalError={error || undefined}
        showChatWindow={showChatWindow}
        sidebar={
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
        }
        chatWindow={
          selectedConversation && (
            <ChatWindow
              messages={selectedConversation.messages || []}
              onSend={handleSendMessage}
              isLoading={isLoading}
              error={sendError?.message || null}
            />
          )
        }
      />
    </ThemeProvider>
  );
}

/**
 * Root application component with providers and global error boundary
 */
export default function App() {
  return (
    <ErrorBoundary
      level="global"
      name="Application"
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        console.error('[Global Error]', error, errorInfo);
        // Here you could send to error tracking service
      }}
      showErrorDetails={import.meta.env.DEV}
    >
      <QueryProvider>
        <AppContent />
      </QueryProvider>
    </ErrorBoundary>
  );
}