import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatStore } from './chatStore'
import type { Conversation } from '../types'

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

describe('useChatStore', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should initialize with empty conversations when localStorage is empty', async () => {
    const { result } = renderHook(() => useChatStore())
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.conversations).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should create a new conversation', async () => {
    const { result } = renderHook(() => useChatStore())
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    let createdConversation: Conversation | undefined
    await act(async () => {
      createdConversation = await result.current.createConversation('Test message')
    })
    
    expect(createdConversation).toBeDefined()
    expect(createdConversation!.title).toBe('Test message')
    expect(result.current.conversations).toHaveLength(1)
  })

  it('should delete a conversation', async () => {
    // Set up existing conversations
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
    
    const { result } = renderHook(() => useChatStore())
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.conversations).toHaveLength(1)
    
    await act(async () => {
      await result.current.deleteConversation('1')
    })
    
    expect(result.current.conversations).toHaveLength(0)
  })

  it('should clear all conversations', async () => {
    // Set up existing conversations  
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
    
    const { result } = renderHook(() => useChatStore())
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.conversations).toHaveLength(2)
    
    await act(async () => {
      await result.current.clearHistory()
    })
    
    expect(result.current.conversations).toHaveLength(0)
  })

  it('should update conversation title', async () => {
    // Set up existing conversation
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
    
    const { result } = renderHook(() => useChatStore())
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.conversations[0].title).toBe('Old Title')
    
    await act(async () => {
      await result.current.updateConversationTitle('1', 'New Title')
    })
    
    expect(result.current.conversations[0].title).toBe('New Title')
  })
})
