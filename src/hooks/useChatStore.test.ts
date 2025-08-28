import { describe, it, expect } from 'vitest'
import { useChatStore } from './useChatStore'
import { useChatStore as originalUseChatStore } from '../store/chatStore'

describe('useChatStore (deprecated export)', () => {
  it('re-exports the useChatStore hook from chatStore', () => {
    expect(useChatStore).toBe(originalUseChatStore)
  })
})
