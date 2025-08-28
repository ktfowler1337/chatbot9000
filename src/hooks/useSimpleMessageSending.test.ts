import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSimpleMessageSending } from './useSimpleMessageSending'

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-id-123')
}))

// Mock environment variable
vi.stubEnv('VITE_BACKEND_URL', 'http://test-backend.com')

describe('useSimpleMessageSending', () => {
  const mockOnMessageAdded = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  it('sends user message and AI response successfully', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ response: 'AI response' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    expect(result.current.isPending).toBe(false)
    expect(result.current.error).toBeNull()

    // Send message
    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    // Should have called onMessageAdded twice (user message + AI response)
    expect(mockOnMessageAdded).toHaveBeenCalledTimes(2)
    
    // First call: user message
    expect(mockOnMessageAdded).toHaveBeenNthCalledWith(1, {
      id: 'test-id-123',
      content: 'Hello',
      role: 'user',
      timestamp: expect.any(Date)
    })

    // Second call: AI response
    expect(mockOnMessageAdded).toHaveBeenNthCalledWith(2, {
      id: 'test-id-123',
      content: 'AI response',
      role: 'assistant',
      timestamp: expect.any(Date)
    })

    // Check API was called correctly
    expect(fetch).toHaveBeenCalledWith(
      'http://test-backend.com/api/v1/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello'
        }),
      }
    )

    expect(result.current.isPending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles invalid message content', async () => {
    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    // Send invalid message (empty)
    await act(async () => {
      await result.current.sendMessage('')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('invalid or too long')
    expect(fetch).not.toHaveBeenCalled()
    expect(mockOnMessageAdded).not.toHaveBeenCalled()
  })

  it('handles very long message content', async () => {
    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    // Send invalid message (too long)
    await act(async () => {
      await result.current.sendMessage('A'.repeat(10001))
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('invalid or too long')
    expect(fetch).not.toHaveBeenCalled()
    expect(mockOnMessageAdded).not.toHaveBeenCalled()
  })

  it('handles API errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ detail: 'Server error' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    // Should still add user message optimistically
    expect(mockOnMessageAdded).toHaveBeenCalledTimes(1)
    expect(mockOnMessageAdded).toHaveBeenCalledWith({
      id: 'test-id-123',
      content: 'Hello',
      role: 'user',
      timestamp: expect.any(Date)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Server error')
    expect(result.current.isPending).toBe(false)
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    // Should still add user message optimistically
    expect(mockOnMessageAdded).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Network error')
  })

  it('handles API response without detail field', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('HTTP 404: Not Found')
  })

  it('resets error state', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.error).toBeTruthy()

    act(() => {
      result.current.reset()
    })

    expect(result.current.error).toBeNull()
  })

  it('trims whitespace from message content', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ response: 'AI response' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    await act(async () => {
      await result.current.sendMessage('  Hello World  ')
    })

    expect(mockOnMessageAdded).toHaveBeenCalledWith({
      id: 'test-id-123',
      content: 'Hello World',
      role: 'user',
      timestamp: expect.any(Date)
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          message: 'Hello World'
        })
      })
    )
  })

  it('uses default backend URL when env var not set', async () => {
    vi.unstubAllEnvs()
    
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ response: 'AI response' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const { result } = renderHook(() => useSimpleMessageSending(mockOnMessageAdded))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/chat',
      expect.any(Object)
    )
  })
})
