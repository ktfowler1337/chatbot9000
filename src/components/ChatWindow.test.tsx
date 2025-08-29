import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWindow } from './ChatWindow';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => 
      <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the MessageBubble component to isolate ChatWindow testing
vi.mock('./MessageBubble', () => ({
  MessageBubble: ({ message }: { message: { role: string; content: string; id: string } }) => (
    <div data-testid="message-bubble">
      <span>{message.role}: {message.content}</span>
    </div>
  ),
}));

// Mock LoadingDots component
vi.mock('./LoadingDots', () => ({
  LoadingDots: () => <div data-testid="loading-dots">Loading...</div>,
}));

// Mock InputBar component 
vi.mock('./InputBar', () => ({
  InputBar: () => <div data-testid="input-bar">Input Bar</div>,
}));

describe('ChatWindow', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello',
      role: 'user' as const,
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: '2',
      content: 'Hi there!',
      role: 'assistant' as const,
      timestamp: new Date('2024-01-01T10:01:00Z'),
    },
  ];

  const mockOnSend = vi.fn();

  it('renders empty state message when no messages', () => {
    // Test empty state display
    render(<ChatWindow messages={[]} onSend={mockOnSend} isLoading={false} />);
    expect(screen.getByText(/select a conversation or start a new chat/i)).toBeInTheDocument();
  });

  it('renders messages when provided', () => {
    // Test message display functionality
    render(<ChatWindow messages={mockMessages} onSend={mockOnSend} isLoading={false} />);
    
    expect(screen.getByText('user: Hello')).toBeInTheDocument();
    expect(screen.getByText('assistant: Hi there!')).toBeInTheDocument();
    expect(screen.getAllByTestId('message-bubble')).toHaveLength(2);
  });

  it('shows loading indicator when isLoading is true', () => {
    // Test loading state display
    render(<ChatWindow messages={mockMessages} onSend={mockOnSend} isLoading={true} />);
    
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
  });

  it('does not show loading indicator when isLoading is false', () => {
    // Test normal state without loading
    render(<ChatWindow messages={mockMessages} onSend={mockOnSend} isLoading={false} />);
    
    expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();
  });

  it('always renders input bar', () => {
    // Test input bar is always present
    render(<ChatWindow messages={[]} onSend={mockOnSend} isLoading={false} />);
    
    expect(screen.getByTestId('input-bar')).toBeInTheDocument();
  });
});