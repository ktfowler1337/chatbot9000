import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';

// Mock ConfirmationDialog to avoid dependency complexity
vi.mock('./ConfirmationDialog', () => ({
  ConfirmationDialog: ({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) => 
    open ? (
      <div data-testid="confirmation-dialog">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

describe('Sidebar', () => {
  const mockConversations = [
    {
      id: '1',
      title: 'First Conversation',
      messages: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Second Conversation',
      messages: [],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    selectedId: '1',
    onSelect: vi.fn(),
    onNew: vi.fn(),
    onClearHistory: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar content', () => {
    // Test sidebar basic rendering
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('displays conversations list', () => {
    // Test conversation list display
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
  });

  it('calls onNew when new chat button is clicked', () => {
    // Test new conversation creation
    render(<Sidebar {...defaultProps} />);
    
    fireEvent.click(screen.getByText('New Chat'));
    expect(defaultProps.onNew).toHaveBeenCalledOnce();
  });

  it('calls onSelect when conversation is clicked', () => {
    // Test conversation selection
    render(<Sidebar {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Second Conversation'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('2');
  });

  it('shows empty state when no conversations', () => {
    // Test empty conversations list
    render(<Sidebar {...defaultProps} conversations={[]} />);
    
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    // Test loading state
    render(<Sidebar {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('opens clear history confirmation dialog', () => {
    // Test clear history dialog opening
    render(<Sidebar {...defaultProps} />);
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
  });

  it('calls onClearHistory when clear is confirmed', () => {
    // Test clear history confirmation
    render(<Sidebar {...defaultProps} />);
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onClearHistory).toHaveBeenCalledOnce();
  });

  it('cancels clear history dialog', () => {
    // Test clear history cancellation
    render(<Sidebar {...defaultProps} />);
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClearHistory).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    // Test edit mode activation
    render(<Sidebar {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText(/rename/i);
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByDisplayValue('First Conversation')).toBeInTheDocument();
  });

  it('saves edited conversation title on Enter key', () => {
    // Test keyboard save functionality
    render(<Sidebar {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText(/rename/i);
    fireEvent.click(editButtons[0]);
    
    const input = screen.getByDisplayValue('First Conversation');
    fireEvent.change(input, { target: { value: 'Updated Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(defaultProps.onRename).toHaveBeenCalledWith('1', 'Updated Title');
  });

  it('cancels edit on Escape key', () => {
    // Test keyboard cancel functionality
    render(<Sidebar {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText(/rename/i);
    fireEvent.click(editButtons[0]);
    
    const input = screen.getByDisplayValue('First Conversation');
    fireEvent.change(input, { target: { value: 'Changed Title' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(defaultProps.onRename).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument();
  });

  it('saves edit when check button is clicked', () => {
    // Test save via check button
    render(<Sidebar {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText(/rename/i);
    fireEvent.click(editButtons[0]);
    
    const input = screen.getByDisplayValue('First Conversation');
    fireEvent.change(input, { target: { value: 'New Title' } });
    
    const checkButton = screen.getByTestId('CheckIcon').closest('button');
    fireEvent.click(checkButton!);
    
    expect(defaultProps.onRename).toHaveBeenCalledWith('1', 'New Title');
  });

  it('cancels edit when close button is clicked', () => {
    // Test cancel via close button
    render(<Sidebar {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText(/rename/i);
    fireEvent.click(editButtons[0]);
    
    const input = screen.getByDisplayValue('First Conversation');
    fireEvent.change(input, { target: { value: 'Changed Title' } });
    
    const closeButton = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(closeButton!);
    
    expect(defaultProps.onRename).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument();
  });

  it('opens delete confirmation when delete button is clicked', () => {
    // Test delete dialog opening
    render(<Sidebar {...defaultProps} />);
    
    const deleteButtons = screen.getAllByLabelText(/delete conversation/i);
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    // Test delete confirmation
    render(<Sidebar {...defaultProps} />);
    
    const deleteButtons = screen.getAllByLabelText(/delete conversation/i);
    fireEvent.click(deleteButtons[0]);
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('cancels delete operation', () => {
    // Test delete cancellation
    render(<Sidebar {...defaultProps} />);
    
    const deleteButtons = screen.getAllByLabelText(/delete conversation/i);
    fireEvent.click(deleteButtons[0]);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
  });

  it('prevents saving invalid conversation titles', () => {
    // Test validation of empty titles
    render(<Sidebar {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText(/rename/i);
    fireEvent.click(editButtons[0]);
    
    const input = screen.getByDisplayValue('First Conversation');
    fireEvent.change(input, { target: { value: '' } });
    
    const checkButton = screen.getByTestId('CheckIcon').closest('button');
    expect(checkButton).toBeDisabled();
  });

  it('does not show clear history button when no conversations', () => {
    // Test clear button visibility
    render(<Sidebar {...defaultProps} conversations={[]} />);
    
    expect(screen.queryByLabelText(/clear/i)).not.toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    // Test loading state interaction
    render(<Sidebar {...defaultProps} isLoading={true} />);
    
    const newChatButton = screen.getByText('New Chat').closest('[role="button"]');
    expect(newChatButton).toHaveAttribute('aria-disabled', 'true');
  });
});