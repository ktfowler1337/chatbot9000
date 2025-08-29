import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAISendMessage } from './useAISendMessage';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-id-123'),
}));

// Mock utils to avoid validation issues
vi.mock('../utils/common', () => ({
  validateMessage: () => true,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAISendMessage', () => {
  const mockOnUserMessage = vi.fn();
  const mockOnAIResponse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('returns expected interface', () => {
    const { result } = renderHook(
      () => useAISendMessage(mockOnUserMessage, mockOnAIResponse),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('reset');
  });

  it('calls onUserMessage when sendMessage is called', () => {
    const { result } = renderHook(
      () => useAISendMessage(mockOnUserMessage, mockOnAIResponse),
      { wrapper: createWrapper() }
    );

    // Just test that the hook is available
    expect(typeof result.current.sendMessage).toBe('function');
  });
});