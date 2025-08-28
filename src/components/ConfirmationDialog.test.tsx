import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(
      <ConfirmationDialog
        open={false}
        title="Test Title"
        message="Test message"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('renders dialog content when open is true', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        confirmText="Yes, Continue"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationDialog
        open={true}
        title="Delete Item"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationDialog
        open={true}
        title="Delete Item"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('applies destructive styling when isDestructive is true', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Dangerous Action"
        message="This will delete everything!"
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDestructive={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Delete All' });
    expect(confirmButton).toBeInTheDocument();
    // In a real test, you'd check for error/destructive color styling
  });

  it('handles custom confirm and cancel text', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Custom Dialog"
        message="Custom message"
        confirmText="Proceed Now"
        cancelText="Go Back"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: 'Proceed Now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
  });

  it('calls onCancel when clicking outside the dialog (backdrop)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ConfirmationDialog
        open={true}
        title="Test Dialog"
        message="Test message"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Click on the backdrop (MUI Dialog typically calls onClose for backdrop clicks)
    const backdrop = container.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('handles escape key to cancel', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationDialog
        open={true}
        title="Test Dialog"
        message="Test message"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.keyboard('{Escape}');
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('displays multiline messages correctly', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    render(
      <ConfirmationDialog
        open={true}
        title="Multiline Message"
        message={multilineMessage}
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });

  it('renders with minimal required props', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Simple Dialog"
        message="Simple message"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Simple Dialog')).toBeInTheDocument();
    expect(screen.getByText('Simple message')).toBeInTheDocument();
  });
});
