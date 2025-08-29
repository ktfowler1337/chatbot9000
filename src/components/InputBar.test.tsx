import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputBar } from './InputBar';

describe('InputBar', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field and send button', () => {
    render(<InputBar onSend={mockOnSend} />);
    
    // Check input field exists with placeholder
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    
    // Check send button exists
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('uses custom placeholder when provided', () => {
    render(<InputBar onSend={mockOnSend} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<InputBar onSend={mockOnSend} />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has valid text', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Hello world');
    
    expect(sendButton).toBeEnabled();
  });

  it('calls onSend with trimmed message when send button is clicked', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, '  Hello world  ');
    await user.click(sendButton);
    
    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  it('calls onSend when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');
    
    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  it('does not send when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    await user.type(input, 'Hello world');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Hello world');
    await user.click(sendButton);
    
    expect(input).toHaveValue('');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<InputBar onSend={mockOnSend} isLoading={true} />);
    
    // Loading spinner should be present
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Send icon should not be present
    expect(screen.queryByTestId('SendIcon')).not.toBeInTheDocument();
  });

  it('disables send button when isLoading is true', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Hello world');
    
    expect(sendButton).toBeDisabled();
  });

  it('does not send message when loading', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');
    
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('does not send empty or whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    // Try empty message
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('normalizes multiple spaces in message', async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(input, 'Hello    world');
    await user.click(sendButton);
    
    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });
});
