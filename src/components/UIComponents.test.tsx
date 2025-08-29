import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingFallback } from './LoadingFallback';
import { EmptyState } from './EmptyState';
import { GlobalErrorAlert } from './GlobalErrorAlert';

describe('LoadingFallback', () => {
  it('renders loading spinner', () => {
    render(<LoadingFallback />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays custom message when provided', () => {
    render(<LoadingFallback message="Loading test..." />);
    
    expect(screen.getByText('Loading test...')).toBeInTheDocument();
  });

  it('accepts custom height', () => {
    const { container } = render(<LoadingFallback height="200px" />);
    
    const loadingBox = container.firstChild as HTMLElement;
    expect(loadingBox).toHaveStyle({ height: '200px' });
  });
});

describe('EmptyState', () => {
  it('renders default message', () => {
    render(<EmptyState />);
    
    expect(screen.getByText(/Select a conversation or start a new chat/)).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<EmptyState message="Custom empty state" />);
    
    expect(screen.getByText('Custom empty state')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>;
    render(<EmptyState icon={<TestIcon />} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    const TestAction = () => <button>Test Action</button>;
    render(<EmptyState action={<TestAction />} />);
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });
});

describe('GlobalErrorAlert', () => {
  it('displays error message', () => {
    render(<GlobalErrorAlert error="Test error message" />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = () => {};
    render(<GlobalErrorAlert error="Test error" onRetry={mockRetry} />);
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows close button when onDismiss is provided', () => {
    const mockDismiss = () => {};
    render(<GlobalErrorAlert error="Test error" onDismiss={mockDismiss} />);
    
    // MUI Alert's close button has a specific role
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
});
