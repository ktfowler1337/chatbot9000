import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatLayout } from './ChatLayout';

// Mock the child components
vi.mock('./ErrorBoundary', () => ({
  ErrorBoundary: ({ children, name }: { children: React.ReactNode; name: string }) => (
    <div data-testid={`error-boundary-${name?.toLowerCase()}`}>
      {children}
    </div>
  ),
}));

vi.mock('./LoadingFallback', () => ({
  LoadingFallback: ({ message }: { message: string }) => (
    <div data-testid="loading-fallback">{message}</div>
  ),
}));

vi.mock('./GlobalErrorAlert', () => ({
  GlobalErrorAlert: ({ 
    error, 
    onDismiss, 
    onRetry 
  }: { 
    error: string; 
    onDismiss?: () => void; 
    onRetry?: () => void; 
  }) => (
    <div data-testid="global-error-alert">
      <span>{error}</span>
      {onDismiss && (
        <button onClick={onDismiss} data-testid="dismiss-button">
          Dismiss
        </button>
      )}
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Retry
        </button>
      )}
    </div>
  ),
}));

vi.mock('./EmptyState', () => ({
  EmptyState: () => <div data-testid="empty-state">No conversation selected</div>,
}));

vi.mock('../constants/app', () => ({
  APP_CONFIG: {
    SIDEBAR_WIDTH: '300px',
  },
}));

describe('ChatLayout', () => {
  const mockSidebar = <div data-testid="sidebar">Sidebar Content</div>;
  const mockChatWindow = <div data-testid="chat-window">Chat Content</div>;

  const defaultProps = {
    sidebar: mockSidebar,
    showChatWindow: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the basic layout structure', () => {
    render(<ChatLayout {...defaultProps} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('shows sidebar content within error boundary', () => {
    render(<ChatLayout {...defaultProps} />);

    const sidebarErrorBoundary = screen.getByTestId('error-boundary-sidebar');
    expect(sidebarErrorBoundary).toContainElement(screen.getByTestId('sidebar'));
  });

  it('shows empty state when showChatWindow is false', () => {
    render(<ChatLayout {...defaultProps} showChatWindow={false} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });

  it('shows chat window when showChatWindow is true', () => {
    render(
      <ChatLayout 
        {...defaultProps} 
        showChatWindow={true} 
        chatWindow={mockChatWindow}
      />
    );

    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-chat')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('wraps chat window in error boundary', () => {
    render(
      <ChatLayout 
        {...defaultProps} 
        showChatWindow={true} 
        chatWindow={mockChatWindow}
      />
    );

    const chatErrorBoundary = screen.getByTestId('error-boundary-chat');
    expect(chatErrorBoundary).toContainElement(screen.getByTestId('chat-window'));
  });

  it('displays global error alert when globalError is provided', () => {
    const errorMessage = 'Something went wrong';
    
    render(
      <ChatLayout 
        {...defaultProps} 
        globalError={errorMessage}
      />
    );

    expect(screen.getByTestId('global-error-alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display global error alert when globalError is not provided', () => {
    render(<ChatLayout {...defaultProps} />);

    expect(screen.queryByTestId('global-error-alert')).not.toBeInTheDocument();
  });

  it('calls onErrorDismiss when dismiss button is clicked', () => {
    const onErrorDismiss = vi.fn();
    
    render(
      <ChatLayout 
        {...defaultProps} 
        globalError="Test error"
        onErrorDismiss={onErrorDismiss}
      />
    );

    const dismissButton = screen.getByTestId('dismiss-button');
    fireEvent.click(dismissButton);

    expect(onErrorDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onErrorRetry when retry button is clicked', () => {
    const onErrorRetry = vi.fn();
    
    render(
      <ChatLayout 
        {...defaultProps} 
        globalError="Test error"
        onErrorRetry={onErrorRetry}
      />
    );

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(onErrorRetry).toHaveBeenCalledTimes(1);
  });

  it('applies correct layout styles', () => {
    const { container } = render(<ChatLayout {...defaultProps} />);
    
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveStyle({
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    });
  });

  it('handles missing chatWindow prop gracefully when showChatWindow is true', () => {
    render(
      <ChatLayout 
        {...defaultProps} 
        showChatWindow={true}
        // chatWindow prop is intentionally omitted
      />
    );

    // Should still render the error boundary for chat
    expect(screen.getByTestId('error-boundary-chat')).toBeInTheDocument();
    // But no chat content should be rendered
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });

  it('can handle both global error and chat window simultaneously', () => {
    render(
      <ChatLayout 
        {...defaultProps} 
        showChatWindow={true}
        chatWindow={mockChatWindow}
        globalError="Global error message"
      />
    );

    expect(screen.getByTestId('global-error-alert')).toBeInTheDocument();
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    expect(screen.getByText('Global error message')).toBeInTheDocument();
  });

  it('maintains proper component hierarchy', () => {
    render(
      <ChatLayout 
        {...defaultProps} 
        showChatWindow={true}
        chatWindow={mockChatWindow}
        globalError="Test error"
      />
    );

    // Sidebar should be in its error boundary
    const sidebarBoundary = screen.getByTestId('error-boundary-sidebar');
    expect(sidebarBoundary).toContainElement(screen.getByTestId('sidebar'));

    // Chat should be in its error boundary
    const chatBoundary = screen.getByTestId('error-boundary-chat');
    expect(chatBoundary).toContainElement(screen.getByTestId('chat-window'));

    // Global error should be present
    expect(screen.getByTestId('global-error-alert')).toBeInTheDocument();
  });

  it('renders without optional props', () => {
    // Test with minimal required props only
    render(
      <ChatLayout 
        sidebar={mockSidebar}
        showChatWindow={false}
      />
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('global-error-alert')).not.toBeInTheDocument();
  });
});