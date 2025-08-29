import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingDots } from './LoadingDots';

describe('LoadingDots', () => {
  it('renders loading dots component', () => {
    render(<LoadingDots />);
    
    // Should have role="status" for accessibility
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible label for screen readers', () => {
    render(<LoadingDots />);
    
    expect(screen.getByLabelText('AI is generating response')).toBeInTheDocument();
  });

  it('renders three dots', () => {
    render(<LoadingDots />);
    
    const container = screen.getByRole('status');
    
    // Should contain exactly 3 dot characters
    expect(container.textContent).toBe('•••');
  });

  it('renders without throwing errors', () => {
    // Simple smoke test - if component renders without errors, test passes
    expect(() => render(<LoadingDots />)).not.toThrow();
  });

  it('has proper structure for animation', () => {
    render(<LoadingDots />);
    
    const container = screen.getByRole('status');
    
    // Should have exactly 3 span elements (the dots)
    const dots = container.querySelectorAll('span');
    expect(dots).toHaveLength(3);
  });
});
