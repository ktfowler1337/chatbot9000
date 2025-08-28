import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import { ChatWindow } from './ChatWindow';
import type { Message } from '../types';

// Mock the lazy-loaded components to avoid issues with Suspense in tests
vi.mock('./MessageBubble', () => ({
  MessageBubble: ({ message }: { message: Message }) => (
    <div data-testid={`message-${message.role}`}>
      <div>{message.content}</div>
      <div>{message.timestamp.toISOString()}</div>
    </div>
  ),
}));

vi.mock('./InputBar', () => ({
  InputBar: ({ onSend, isLoading }: { onSend: (msg: string) => void; isLoading: boolean }) => (
    <div>
      <input 
        data-testid="chat-input" 
        placeholder="Type your message..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            onSend(target.value);
            target.value = '';
          }
        }}
      />
      <button 
        data-testid="send-button" 
        disabled={isLoading}
        onClick={() => {
          const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
          onSend(input.value);
          input.value = '';
        }}
      >
        {isLoading ? 'Loading...' : 'Send'}
      </button>
    </div>
  ),
}));

vi.mock('./LoadingDots', () => ({
  LoadingDots: () => <div data-testid="loading-dots">Loading...</div>,
}));

describe('ChatWindow Integration', () => {
  const mockOnSend = vi.fn();
  
  const createMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'test-id',
    content: 'Test message',
    role: 'user',
    timestamp: new Date('2025-01-01T12:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no messages are present', () => {
    render(<ChatWindow messages={[]} onSend={mockOnSend} />);
    
    expect(screen.getByText('Select a conversation or start a new chat')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('displays messages when they are provided', () => {
    const messages = [
      createMessage({ id: '1', content: 'Hello!', role: 'user' }),
      createMessage({ id: '2', content: 'Hi there!', role: 'assistant' }),
    ];
    
    render(<ChatWindow messages={messages} onSend={mockOnSend} />);
    
    expect(screen.getByTestId('message-user')).toBeInTheDocument();
    expect(screen.getByTestId('message-assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading state when AI is responding', () => {
    render(<ChatWindow messages={[]} onSend={mockOnSend} isLoading={true} />);
    
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    expect(screen.getAllByText('Loading...')).toHaveLength(2); // Both loading dots and send button
  });

  it('shows error message when provided', () => {
    render(<ChatWindow messages={[]} onSend={mockOnSend} error="Something went wrong" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onSend when user submits a message via button', async () => {
    const user = userEvent.setup();
    render(<ChatWindow messages={[]} onSend={mockOnSend} />);
    
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('calls onSend when user submits a message via Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatWindow messages={[]} onSend={mockOnSend} />);
    
    const input = screen.getByTestId('chat-input');
    
    await user.type(input, 'Test message{Enter}');
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('disables send functionality when loading', async () => {
    const user = userEvent.setup();
    render(<ChatWindow messages={[]} onSend={mockOnSend} isLoading={true} />);
    
    const sendButton = screen.getByTestId('send-button');
    
    expect(sendButton).toBeDisabled();
    
    await user.click(sendButton);
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('handles conversation flow with multiple messages', () => {
    const messages = [
      createMessage({ id: '1', content: 'What is React?', role: 'user' }),
      createMessage({ 
        id: '2', 
        content: 'React is a JavaScript library for building user interfaces.',
        role: 'assistant' 
      }),
      createMessage({ id: '3', content: 'Thanks for explaining!', role: 'user' }),
    ];
    
    render(<ChatWindow messages={messages} onSend={mockOnSend} />);
    
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.getByText('React is a JavaScript library for building user interfaces.')).toBeInTheDocument();
    expect(screen.getByText('Thanks for explaining!')).toBeInTheDocument();
    
    // Should have 2 user messages and 1 assistant message
    expect(screen.getAllByTestId('message-user')).toHaveLength(2);
    expect(screen.getAllByTestId('message-assistant')).toHaveLength(1);
  });

  it('shows both error and loading states correctly', () => {
    render(
      <ChatWindow 
        messages={[]} 
        onSend={mockOnSend} 
        isLoading={true} 
        error="Network error occurred" 
      />
    );
    
    // Should show both error and loading
    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
  });
});
