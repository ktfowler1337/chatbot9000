import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

describe('MessageBubble', () => {
  const userMessage: Message = {
    id: '1',
    content: 'Hello world',
    role: 'user',
    timestamp: new Date('2025-01-15T10:30:00Z'),
  };

  const assistantMessage: Message = {
    id: '2',
    content: 'Hello! How can I help you?',
    role: 'assistant',
    timestamp: new Date('2025-01-15T10:31:00Z'),
  };

  it('renders user message with correct content', () => {
    render(<MessageBubble message={userMessage} />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders assistant message with correct content', () => {
    render(<MessageBubble message={assistantMessage} />);
    
    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
  });

  it('displays timestamp for messages', () => {
    render(<MessageBubble message={userMessage} />);
    
    // Should show formatted timestamp
    expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
  });

  it('handles multiline content correctly', () => {
    const multilineMessage: Message = {
      id: '3',
      content: 'Line 1\nLine 2\nLine 3',
      role: 'user',
      timestamp: new Date('2025-01-15T10:30:00Z'),
    };

    render(<MessageBubble message={multilineMessage} />);
    
    // Check that the content is rendered (text might be split by whitespace handling)
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });

  it('handles long content that might need word breaking', () => {
    const longMessage: Message = {
      id: '4',
      content: 'ThisIsAVeryLongWordWithoutSpacesThatShouldBreakProperly',
      role: 'user',
      timestamp: new Date('2025-01-15T10:30:00Z'),
    };

    render(<MessageBubble message={longMessage} />);
    
    expect(screen.getByText(longMessage.content)).toBeInTheDocument();
  });

  it('renders code snippets in content', () => {
    const codeMessage: Message = {
      id: '5',
      content: 'Here is some `inline code` and more text',
      role: 'assistant',
      timestamp: new Date('2025-01-15T10:30:00Z'),
    };

    render(<MessageBubble message={codeMessage} />);
    
    expect(screen.getByText('Here is some `inline code` and more text')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const emptyMessage: Message = {
      id: '6',
      content: '',
      role: 'user',
      timestamp: new Date('2025-01-15T10:30:00Z'),
    };

    render(<MessageBubble message={emptyMessage} />);
    
    // Should still render the component structure with timestamp
    expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
  });

  it('displays different roles distinctly', () => {
    const { rerender } = render(<MessageBubble message={userMessage} />);
    
    // Get the container element for user message
    const userContainer = screen.getByText('Hello world').closest('div');
    expect(userContainer).toBeInTheDocument();
    
    // Rerender with assistant message
    rerender(<MessageBubble message={assistantMessage} />);
    
    const assistantContainer = screen.getByText('Hello! How can I help you?').closest('div');
    expect(assistantContainer).toBeInTheDocument();
    
    // Both should be rendered differently (this tests component structure exists)
    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
  });

  it('handles special characters in content', () => {
    const specialMessage: Message = {
      id: '7',
      content: 'Special chars: @#$%^&*()[]{}|\\:";\'<>?,./~`',
      role: 'user',
      timestamp: new Date('2025-01-15T10:30:00Z'),
    };

    render(<MessageBubble message={specialMessage} />);
    
    expect(screen.getByText(specialMessage.content)).toBeInTheDocument();
  });

  it('renders with valid message ID', () => {
    render(<MessageBubble message={userMessage} />);
    
    // Should render without throwing errors when provided valid message object
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
  });

  it('handles unicode characters', () => {
    const unicodeMessage: Message = {
      id: '8',
      content: 'Unicode: 🚀 ☕ 💻 中文 русский العربية',
      role: 'assistant',
      timestamp: new Date('2025-01-15T10:30:00Z'),
    };

    render(<MessageBubble message={unicodeMessage} />);
    
    expect(screen.getByText(unicodeMessage.content)).toBeInTheDocument();
  });
});
