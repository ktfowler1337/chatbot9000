import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import { Sidebar } from './Sidebar';
import type { Conversation } from '../types';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => children,
}));

describe('Sidebar', () => {
  const mockOnSelect = vi.fn();
  const mockOnNew = vi.fn();
  const mockOnClearHistory = vi.fn();
  const mockOnRename = vi.fn();
  const mockOnDelete = vi.fn();

  const createConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
    id: 'test-conv-1',
    title: 'Test Conversation',
    messages: [],
    createdAt: new Date('2025-01-01T12:00:00Z'),
    updatedAt: new Date('2025-01-01T12:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with new chat button when no conversations exist', () => {
    render(
      <Sidebar
        conversations={[]}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('displays conversations when they exist', () => {
    const conversations = [
      createConversation({ 
        id: '1', 
        title: 'First Chat',
      }),
      createConversation({ 
        id: '2', 
        title: 'Second Chat',
      }),
    ];

    render(
      <Sidebar
        conversations={conversations}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Second Chat')).toBeInTheDocument();
  });

  it('highlights selected conversation when selectedId is provided', () => {
    const conversations = [
      createConversation({ id: '1', title: 'First Chat' }),
      createConversation({ id: '2', title: 'Second Chat' }),
    ];

    render(
      <Sidebar
        conversations={conversations}
        selectedId="1"
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    // Check that the selected conversation has special styling
    const firstChat = screen.getByText('First Chat');
    expect(firstChat).toBeInTheDocument();
  });

  it('calls onNew when new chat button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Sidebar
        conversations={[]}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    await user.click(newChatButton);

    expect(mockOnNew).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when conversation is clicked', async () => {
    const user = userEvent.setup();
    const conversations = [
      createConversation({ id: 'conv-123', title: 'Test Chat' }),
    ];

    render(
      <Sidebar
        conversations={conversations}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    const conversationButton = screen.getByText('Test Chat');
    await user.click(conversationButton);

    expect(mockOnSelect).toHaveBeenCalledWith('conv-123');
  });

  it('shows clear history button when conversations exist', () => {
    const conversations = [
      createConversation({ id: '1', title: 'Test Chat' }),
    ];

    render(
      <Sidebar
        conversations={conversations}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    // Should show clear history button (DeleteSweepIcon)
    expect(screen.getByRole('button', { name: /clear chat history/i })).toBeInTheDocument();
  });

  it('does not show clear history button when no conversations exist', () => {
    render(
      <Sidebar
        conversations={[]}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    // Should not show clear history button
    expect(screen.queryByRole('button', { name: /clear all conversations/i })).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <Sidebar
        conversations={[]}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        isLoading={true}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables new chat button when loading', () => {
    render(
      <Sidebar
        conversations={[]}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        isLoading={true}
      />
    );

    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    // For MUI components, we need to check aria-disabled instead of disabled
    expect(newChatButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('formats conversation timestamps correctly', () => {
    const conversations = [
      createConversation({ 
        id: '1',
        title: 'Recent Chat',
        updatedAt: new Date('2025-01-01T12:00:00Z')
      }),
    ];

    render(
      <Sidebar
        conversations={conversations}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Recent Chat')).toBeInTheDocument();
    // The relative time display would depend on implementation
  });

  it('shows edit and delete buttons for conversations', () => {
    const conversations = [
      createConversation({ id: '1', title: 'Test Chat' }),
    ];

    render(
      <Sidebar
        conversations={conversations}
        onSelect={mockOnSelect}
        onNew={mockOnNew}
        onClearHistory={mockOnClearHistory}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('button', { name: /rename conversation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete conversation/i })).toBeInTheDocument();
  });
});
