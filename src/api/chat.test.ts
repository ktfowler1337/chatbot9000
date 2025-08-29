import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatApiService } from './chat';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ChatApiService', () => {
  let service: ChatApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChatApiService('http://localhost:8000');
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('constructor', () => {
    it('creates service with default baseURL', () => {
      const defaultService = new ChatApiService();
      expect(defaultService).toBeInstanceOf(ChatApiService);
    });

    it('creates service with custom baseURL', () => {
      const customService = new ChatApiService('http://custom:9000');
      expect(customService).toBeInstanceOf(ChatApiService);
    });
  });

  describe('getConversations', () => {
    it('returns empty array when no conversations stored', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const conversations = await service.getConversations();
      
      expect(conversations).toEqual([]);
    });

    it('returns parsed conversations from localStorage', async () => {
      const storedData = JSON.stringify([
        {
          id: 'conv-1',
          title: 'Test Chat',
          messages: [],
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
        },
      ]);
      
      mockLocalStorage.getItem.mockReturnValue(storedData);
      
      const conversations = await service.getConversations();
      
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('conv-1');
      expect(conversations[0].title).toBe('Test Chat');
    });

    it('handles corrupted localStorage data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const conversations = await service.getConversations();
      
      expect(conversations).toEqual([]);
    });
  });

  describe('createConversation', () => {
    it('creates conversation without initial message', async () => {
      const conversation = await service.createConversation();
      
      expect(conversation.id).toBeDefined();
      expect(conversation.title).toBe('New Conversation');
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('creates conversation with initial message as title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'AI response', processing_time_ms: 100 }),
      });

      const conversation = await service.createConversation('Hello world');
      
      expect(conversation.title).toBe('Hello world');
    });

    it('truncates long initial message for title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'AI response', processing_time_ms: 100 }),
      });

      const longMessage = 'a'.repeat(60);
      const conversation = await service.createConversation(longMessage);
      
      expect(conversation.title).toHaveLength(50); // 47 chars + '...'
      expect(conversation.title.endsWith('...')).toBe(true);
    });
  });

  describe('deleteConversation', () => {
    it('removes conversation from localStorage', async () => {
      const storedData = JSON.stringify([
        { id: 'conv-1', title: 'Chat 1', messages: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 'conv-2', title: 'Chat 2', messages: [], createdAt: new Date(), updatedAt: new Date() },
      ]);
      
      mockLocalStorage.getItem.mockReturnValue(storedData);
      
      await service.deleteConversation('conv-1');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('conv-2');
    });
  });

  describe('clearConversations', () => {
    it('removes conversations from localStorage', async () => {
      await service.clearConversations();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chatbot9000-conversations');
    });
  });

  describe('healthCheck', () => {
    it('makes request to health endpoint', async () => {
      const healthResponse = { status: 'ok', timestamp: '2025-01-15T10:00:00Z' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(healthResponse),
      });
      
      const result = await service.healthCheck();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(healthResponse);
    });

    it('throws error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });
      
      await expect(service.healthCheck()).rejects.toThrow('API request failed');
    });
  });

  describe('sendMessage', () => {
    it('gets AI response from backend', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'AI response', processing_time_ms: 100 }),
      });
      
      const message = await service.sendMessage('Hello');
      
      expect(message.content).toBe('AI response');
      expect(message.role).toBe('assistant');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('makes correct API request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'AI response', processing_time_ms: 100 }),
      });
      
      await service.sendMessage('Hello');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ message: 'Hello' }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      await expect(service.sendMessage('Hello')).rejects.toThrow('API request failed');
    });

    it('handles non-JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Not JSON')),
      });
      
      await expect(service.sendMessage('Hello')).rejects.toThrow('API request failed');
    });
  });
});
