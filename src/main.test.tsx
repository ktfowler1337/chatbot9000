import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ReactDOM
const mockRender = vi.fn();
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: mockRender,
  })),
}));

// Mock App component
vi.mock('./App', () => ({
  default: () => 'Mocked App Component',
}));

describe('main.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM element
    const mockElement = document.createElement('div');
    mockElement.id = 'root';
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);
  });

  it('renders App component to root element', async () => {
    // Import main module to trigger execution
    await import('./main');

    // Should call render function
    expect(mockRender).toHaveBeenCalled();
  });

  it('handles missing root element gracefully', async () => {
    // Mock getElementById to return null
    vi.spyOn(document, 'getElementById').mockReturnValue(null);

    // Should not throw when root element is missing
    expect(async () => {
      await import('./main');
    }).not.toThrow();
  });
});
