import React, { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingFallback } from './LoadingFallback';
import { GlobalErrorAlert } from './GlobalErrorAlert';
import { EmptyState } from './EmptyState';
import { APP_CONFIG } from '../constants/app';

interface ChatLayoutProps {
  sidebar: ReactNode;
  chatWindow?: ReactNode;
  globalError?: string;
  showChatWindow: boolean;
  onErrorDismiss?: () => void;
  onErrorRetry?: () => void;
}

/**
 * Main chat application layout component
 */
export const ChatLayout = ({
  sidebar,
  chatWindow,
  globalError,
  showChatWindow,
  onErrorDismiss,
  onErrorRetry,
}: ChatLayoutProps) => (
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
      <ErrorBoundary
        level="feature"
        name="Sidebar"
        onError={(error: Error, errorInfo: React.ErrorInfo) => {
          console.error('[Sidebar Error]', error, errorInfo);
        }}
      >
        <Suspense fallback={<LoadingFallback height="100%" message="Loading sidebar..." />}>
          {sidebar}
        </Suspense>
      </ErrorBoundary>
    </Box>

    {/* Main content area */}
    <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {/* Global error display */}
      {globalError && (
        <GlobalErrorAlert 
          error={globalError}
          onDismiss={onErrorDismiss}
          onRetry={onErrorRetry}
        />
      )}

      {showChatWindow ? (
        <ErrorBoundary
          level="feature"
          name="Chat"
          onError={(error: Error, errorInfo: React.ErrorInfo) => {
            console.error('[Chat Error]', error, errorInfo);
          }}
        >
          <Suspense fallback={<LoadingFallback height="100%" message="Loading chat..." />}>
            {chatWindow}
          </Suspense>
        </ErrorBoundary>
      ) : (
        <EmptyState />
      )}
    </Box>
  </Box>
);
