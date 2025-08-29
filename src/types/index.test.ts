import { describe, it, expect, vi } from 'vitest';
import type { Message, Conversation, MessageRole, ChatStore } from './index';

describe('Types', () => {
  describe('MessageRole', () => {
    it('accepts valid role values', () => {
      const userRole: MessageRole = 'user';
      const assistantRole: MessageRole = 'assistant';
      
      expect(userRole).toBe('user');
      expect(assistantRole).toBe('assistant');
    });
  });

  describe('Message', () => {
    it('creates valid message object', () => {
      const message: Message = {
        id: 'msg-1',
        content: 'Hello world',
        role: 'user',
        timestamp: new Date('2025-01-15T10:30:00Z'),
      };

      expect(message.id).toBe('msg-1');
      expect(message.content).toBe('Hello world');
      expect(message.role).toBe('user');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('enforces required properties', () => {
      // This test validates the type structure exists
      const createMessage = (
        id: string,
        content: string,
        role: MessageRole,
        timestamp: Date
      ): Message => ({
        id,
        content,
        role,
        timestamp,
      });

      const msg = createMessage('1', 'test', 'user', new Date());
      expect(msg).toBeDefined();
    });
  });

  describe('Conversation', () => {
    it('creates valid conversation object', () => {
      const conversation: Conversation = {
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [],
        createdAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-15T10:30:00Z'),
      };

      expect(conversation.id).toBe('conv-1');
      expect(conversation.title).toBe('Test Conversation');
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('accepts messages array', () => {
      const message: Message = {
        id: 'msg-1',
        content: 'Hello',
        role: 'user',
        timestamp: new Date(),
      };

      const conversation: Conversation = {
        id: 'conv-1',
        title: 'Test',
        messages: [message],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(conversation.messages).toHaveLength(1);
      expect(conversation.messages[0]).toEqual(message);
    });
  });

  describe('ChatStore', () => {
    it('defines correct interface structure', () => {
      // Mock implementation to validate interface
      const mockStore: ChatStore = {
        conversations: [],
        isLoading: false,
        error: null,
        createConversation: vi.fn().mockResolvedValue({} as Conversation),
        updateConversation: vi.fn().mockResolvedValue(undefined),
        updateConversationTitle: vi.fn().mockResolvedValue(undefined),
        deleteConversation: vi.fn().mockResolvedValue(undefined),
        clearHistory: vi.fn().mockResolvedValue(undefined),
        removeMessage: vi.fn().mockResolvedValue(undefined),
      };

      expect(mockStore.conversations).toEqual([]);
      expect(mockStore.isLoading).toBe(false);
      expect(mockStore.error).toBe(null);
      expect(typeof mockStore.createConversation).toBe('function');
      expect(typeof mockStore.updateConversation).toBe('function');
      expect(typeof mockStore.updateConversationTitle).toBe('function');
      expect(typeof mockStore.deleteConversation).toBe('function');
      expect(typeof mockStore.clearHistory).toBe('function');
      expect(typeof mockStore.removeMessage).toBe('function');
    });

    it('conversations property is readonly', () => {
      // TypeScript compile-time test - readonly array
      const conversations: readonly Conversation[] = [];
      const store: Partial<ChatStore> = {
        conversations,
      };
      
      expect(store.conversations).toBeDefined();
    });
  });

  describe('Message validation', () => {
    it('validates message with user role', () => {
      const isValidMessage = (msg: Message): boolean => {
        return !!(
          msg.id &&
          msg.content &&
          (msg.role === 'user' || msg.role === 'assistant') &&
          msg.timestamp instanceof Date
        );
      };

      const validMessage: Message = {
        id: '1',
        content: 'test',
        role: 'user',
        timestamp: new Date(),
      };

      expect(isValidMessage(validMessage)).toBe(true);
    });

    it('validates message with assistant role', () => {
      const message: Message = {
        id: '2',
        content: 'response',
        role: 'assistant',
        timestamp: new Date(),
      };

      expect(message.role).toBe('assistant');
    });
  });
});
