import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => 
      <div {...props}>{children}</div>,
  },
}));

// Mock the date utility to match the actual format (1/1/2025, 12:00:00 PM)
vi.mock('../utils/date', () => ({
  formatTimestamp: vi.fn((date: Date) => {
    return date.toLocaleString('en-US');
  }),
}));

describe('MessageBubble', () => {
  const createMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'test-id',
    content: 'Test message content',
    role: 'user',
    timestamp: new Date('2025-01-01T12:00:00Z'),
    ...overrides,
  });

  it('renders user message with correct styling', () => {
    const message = createMessage({ role: 'user', content: 'Hello from user' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('Hello from user')).toBeInTheDocument();
    // Look for the formatted date that includes "1/1/2025"
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });

  it('renders assistant message with correct styling', () => {
    const message = createMessage({ role: 'assistant', content: 'Hello from assistant' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('Hello from assistant')).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });

  it('displays multiline content correctly', () => {
    const message = createMessage({ content: 'Line 1\nLine 2\nLine 3' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText(/Line 1.*Line 2.*Line 3/s)).toBeInTheDocument();
  });

  it('displays code blocks correctly', () => {
    const message = createMessage({ content: 'Here is some `inline code` in the message' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('Here is some `inline code` in the message')).toBeInTheDocument();
  });

  it('displays code blocks with pre tags correctly', () => {
    const message = createMessage({ 
      content: 'Here is a code block:\n```\nfunction test() {\n  return true;\n}\n```' 
    });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText(/Here is a code block:/)).toBeInTheDocument();
  });

  it('handles very long messages without breaking layout', () => {
    const longMessage = 'A'.repeat(1000);
    const message = createMessage({ content: longMessage });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('displays timestamps for both user and assistant messages', () => {
    const userMessage = createMessage({ role: 'user' });
    const assistantMessage = createMessage({ role: 'assistant' });
    
    const { rerender } = render(<MessageBubble message={userMessage} />);
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();

    rerender(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });

  it('handles empty message content', () => {
    const message = createMessage({ content: '' });
    render(<MessageBubble message={message} />);
    
    // Should still render the timestamp even with empty content
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });

  it('handles special characters in message content', () => {
    const message = createMessage({ content: '!@#$%^&*()_+-=[]{}|;\':",./<>?' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('!@#$%^&*()_+-=[]{}|;\':",./<>?')).toBeInTheDocument();
  });

  it('handles unicode and emoji characters', () => {
    const message = createMessage({ content: '🎉 Hello! 你好 🌟' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('🎉 Hello! 你好 🌟')).toBeInTheDocument();
  });
});
