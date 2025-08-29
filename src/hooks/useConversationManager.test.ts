import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConversationManager } from './useConversationManager';

// Mock the store and AI hook
vi.mock('../store/chatStore', () => ({
  useChatStore: () => ({
    conversations: [],
    isLoading: false,
    error: null,
    createConversation: vi.fn().mockResolvedValue({ id: 'test-conv', title: 'Test' }),
    updateConversation: vi.fn(),
    updateConversationTitle: vi.fn(),
    deleteConversation: vi.fn(),
    clearHistory: vi.fn(),
    removeMessage: vi.fn(),
  }),
}));

vi.mock('./useAISendMessage', () => ({
  useAISendMessage: () => ({
    sendMessage: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

describe('useConversationManager', () => {
  it('returns expected interface', () => {
    const { result } = renderHook(() => useConversationManager());

    expect(result.current).toHaveProperty('selectedId');
    expect(result.current).toHaveProperty('showChatWindow');
    expect(result.current).toHaveProperty('conversations');
    expect(result.current).toHaveProperty('handleSelectConversation');
    expect(result.current).toHaveProperty('handleNewChat');
    expect(result.current).toHaveProperty('handleSendMessage');
  });

  it('initializes with correct state', () => {
    const { result } = renderHook(() => useConversationManager());

    expect(result.current.selectedId).toBeUndefined();
    expect(result.current.showChatWindow).toBe(false);
    expect(result.current.conversations).toEqual([]);
  });
});