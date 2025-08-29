import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import type { Conversation } from '../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock nanoid for ID generation
vi.mock('../utils/common', () => ({
  createErrorMessage: vi.fn((error) => error?.message || 'Unknown error'),
  generateId: vi.fn(() => 'test-id-123'),
}));

describe('useChatStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('initializes with empty state when no localStorage data', async () => {
    // Test initial empty state
    const { result } = renderHook(() => useChatStore());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('loads existing conversations from localStorage', async () => {
    // Test loading saved conversations
    const mockData = JSON.stringify([
      {
        id: '1',
        title: 'Test Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);
    mockLocalStorage.getItem.mockReturnValue(mockData);

    const { result } = renderHook(() => useChatStore());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe('Test Conversation');
  });

  it('handles corrupted localStorage data gracefully', async () => {
    // Test error handling for corrupted data
    mockLocalStorage.getItem.mockReturnValue('invalid json');

    const { result } = renderHook(() => useChatStore());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('creates new conversation successfully', async () => {
    // Test new conversation creation
    const { result } = renderHook(() => useChatStore());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let newConversation: Conversation | undefined;
    await act(async () => {
      newConversation = await result.current.createConversation('Hello World');
    });

    expect(newConversation).toBeDefined();
    expect(newConversation!.title).toBe('Hello World');
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('deletes conversation successfully', async () => {
    // Test conversation deletion
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: 'test-id',
        title: 'Test',
        messages: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]));

    const { result } = renderHook(() => useChatStore());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteConversation('test-id');
    });

    expect(result.current.conversations).toHaveLength(0);
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('clears all conversations', async () => {
    // Test clearing conversation history
    const { result } = renderHook(() => useChatStore());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(result.current.conversations).toEqual([]);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chatbot9000-conversations');
  });
});