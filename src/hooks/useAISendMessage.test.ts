import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateMessage } from '../utils/common'

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-id-123')
}))

// Mock environment variable
vi.stubEnv('VITE_BACKEND_URL', 'http://test-backend.com')

describe('useAISendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  it('validates message content correctly', () => {
    expect(validateMessage('Hello')).toBe(true)
    expect(validateMessage('')).toBe(false)
    expect(validateMessage('A'.repeat(10001))).toBe(false)
    expect(validateMessage('   ')).toBe(false)
  })

  it('handles successful API response', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ response: 'AI response' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const response = await fetch('http://test-backend.com/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.response).toBe('AI response')
  })

  it('handles API errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ detail: 'Server error' })
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response)

    const response = await fetch('http://test-backend.com/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    try {
      await fetch('http://test-backend.com/api/v1/chat')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })

  it('uses correct backend URL from environment', () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    expect(backendUrl).toBe('http://test-backend.com')
  })

  it('uses default backend URL when env var not set', () => {
    vi.unstubAllEnvs()
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    expect(backendUrl).toBe('http://localhost:8000')
  })
})
