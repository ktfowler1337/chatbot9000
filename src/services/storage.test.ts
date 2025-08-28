import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService, storageService } from './storage'
import type { Conversation } from '../types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = StorageService.getInstance()
      const instance2 = StorageService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('exports the singleton instance', () => {
      expect(storageService).toBeInstanceOf(StorageService)
    })
  })

  describe('getConversations', () => {
    it('returns empty array when no data in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const result = await storageService.getConversations()
      
      expect(result).toEqual([])
      expect(localStorageMock.getItem).toHaveBeenCalledWith('chatbot9000-chat-history')
    })

    it('returns parsed conversations from localStorage', async () => {
      const storedData = JSON.stringify([
        {
          id: 'conv-1',
          title: 'Test Conversation',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messages: [
            {
              id: 'msg-1',
              content: 'Hello',
              role: 'user',
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          ]
        }
      ])
      localStorageMock.getItem.mockReturnValue(storedData)
      
      const result = await storageService.getConversations()
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('conv-1')
      expect(result[0].title).toBe('Test Conversation')
      expect(result[0].messages).toHaveLength(1)
      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(result[0].updatedAt).toBeInstanceOf(Date)
      expect(result[0].messages[0].timestamp).toBeInstanceOf(Date)
    })

    it('returns empty array when JSON parsing fails', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = await storageService.getConversations()
      
      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing stored conversations:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('saveConversations', () => {
    it('saves conversations to localStorage', async () => {
      const conversations: Conversation[] = [
        {
          id: 'conv-1',
          title: 'Test Conversation',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          messages: [
            {
              id: 'msg-1',
              content: 'Hello',
              role: 'user',
              timestamp: new Date('2024-01-01T00:00:00.000Z')
            }
          ]
        }
      ]
      
      await storageService.saveConversations(conversations)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chatbot9000-chat-history',
        expect.stringContaining('conv-1')
      )
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData[0].createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(savedData[0].messages[0].timestamp).toBe('2024-01-01T00:00:00.000Z')
    })

    it('throws error when localStorage.setItem fails', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const conversations: Conversation[] = []
      
      await expect(storageService.saveConversations(conversations))
        .rejects.toThrow('Failed to save conversations')
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving conversations:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('clearConversations', () => {
    it('removes data from localStorage', async () => {
      await storageService.clearConversations()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('chatbot9000-chat-history')
    })

    it('throws error when localStorage.removeItem fails', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await expect(storageService.clearConversations())
        .rejects.toThrow('Failed to clear conversations')
      
      expect(consoleSpy).toHaveBeenCalledWith('Error clearing conversations:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('getConversation', () => {
    it('returns conversation by ID', async () => {
      const storedData = JSON.stringify([
        {
          id: 'conv-1',
          title: 'Test Conversation',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          messages: []
        }
      ])
      localStorageMock.getItem.mockReturnValue(storedData)
      
      const result = await storageService.getConversation('conv-1')
      
      expect(result).toBeTruthy()
      expect(result?.id).toBe('conv-1')
      expect(result?.title).toBe('Test Conversation')
    })

    it('returns null when conversation not found', async () => {
      localStorageMock.getItem.mockReturnValue('[]')
      
      const result = await storageService.getConversation('non-existent')
      
      expect(result).toBeNull()
    })
  })
})
