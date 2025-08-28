import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatApiService } from './chat'

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })
})

describe('ChatApiService', () => {
  let chatService: ChatApiService

  beforeEach(() => {
    chatService = new ChatApiService('http://test-api.com')
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should initialize with correct base URL', () => {
    expect(chatService).toBeInstanceOf(ChatApiService)
    
    const defaultService = new ChatApiService()
    expect(defaultService).toBeInstanceOf(ChatApiService)
  })

  it('should load empty conversations from localStorage', async () => {
    const conversations = await chatService.getConversations()
    expect(conversations).toEqual([])
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chatbot9000-conversations')
  })

  it('should load existing conversations from localStorage', async () => {
    const mockConversations = [
      {
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConversations))
    
    const conversations = await chatService.getConversations()
    expect(conversations).toHaveLength(1)
    expect(conversations[0].title).toBe('Test Chat')
  })

  it('should handle localStorage parse errors', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-json')
    
    const conversations = await chatService.getConversations()
    expect(conversations).toEqual([])
  })

  it('should create a new conversation', async () => {
    // Test creating conversation without initial message (no API call)
    const conversation = await chatService.createConversation()
    
    expect(conversation).toBeDefined()
    expect(conversation.title).toBe('New Conversation')
    expect(conversation.messages).toEqual([])
    expect(conversation.id).toBeDefined()
    expect(conversation.createdAt).toBeInstanceOf(Date)
    expect(conversation.updatedAt).toBeInstanceOf(Date)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should create a new conversation with initial message', async () => {
    // Mock API response for initial message
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ 
        response: 'Hello! How can I help you?',
        processing_time_ms: 150
      })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)
    
    const conversation = await chatService.createConversation('Hello world')
    
    expect(conversation).toBeDefined()
    expect(conversation.title).toBe('Hello world')
    expect(conversation.id).toBeDefined()
    expect(conversation.createdAt).toBeInstanceOf(Date)
    expect(conversation.updatedAt).toBeInstanceOf(Date)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should truncate long titles when creating conversation', async () => {
    // Mock API response for the initial message
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ 
        response: 'Response to long message',
        processing_time_ms: 150
      })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)
    
    const longMessage = 'A'.repeat(100)
    const conversation = await chatService.createConversation(longMessage)
    
    expect(conversation.title).toBe('A'.repeat(47) + '...')
  })

  it('should send message to API successfully', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ 
        response: 'Hello! How can I help you?',
        processing_time_ms: 150
      })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const aiMessage = await chatService.sendMessage('Hello')
    
    expect(fetch).toHaveBeenCalledWith(
      'http://test-api.com/api/v1/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ message: 'Hello' })
      })
    )
    
    expect(aiMessage.content).toBe('Hello! How can I help you?')
    expect(aiMessage.role).toBe('assistant')
    expect(aiMessage.id).toBeDefined()
    expect(aiMessage.timestamp).toBeInstanceOf(Date)
  })

  it('should handle API errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ detail: 'Server error' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)
    
    await expect(chatService.sendMessage('Hello')).rejects.toThrow('Server error')
  })

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    
    await expect(chatService.sendMessage('Hello')).rejects.toThrow('API request failed')
  })

  it('should delete conversation', async () => {
    // Set up some conversations
    const mockConversations = [
      {
        id: '1',
        title: 'Test Chat 1',
        messages: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        title: 'Test Chat 2',
        messages: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConversations))
    
    await chatService.deleteConversation('1')
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'chatbot9000-conversations',
      expect.stringContaining('"Test Chat 2"')
    )
  })

  it('should clear all conversations', async () => {
    await chatService.clearConversations()
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chatbot9000-conversations')
  })

  it('should update conversation title', async () => {
    const mockConversations = [
      {
        id: '1',
        title: 'Old Title',
        messages: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConversations))
    
    const updatedConversation = await chatService.updateConversationTitle('1', 'New Title')
    
    expect(updatedConversation.title).toBe('New Title')
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should handle conversation not found', async () => {
    mockLocalStorage.getItem.mockReturnValue('[]')
    
    await expect(chatService.updateConversationTitle('nonexistent', 'New Title')).rejects.toThrow('Conversation not found')
  })
})
