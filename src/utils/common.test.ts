import { describe, it, expect } from 'vitest'
import { 
  validateMessage, 
  validateConversationTitle, 
  sanitizeInput, 
  generateId, 
  createErrorMessage 
} from './common'

describe('common utilities', () => {
  describe('validateMessage', () => {
    it('returns true for valid messages', () => {
      expect(validateMessage('Hello world')).toBe(true)
      expect(validateMessage('A'.repeat(1000))).toBe(true)
    })

    it('returns false for empty or whitespace-only messages', () => {
      expect(validateMessage('')).toBe(false)
      expect(validateMessage('   ')).toBe(false)
      expect(validateMessage('\n\t')).toBe(false)
    })

    it('returns false for messages that are too long', () => {
      expect(validateMessage('A'.repeat(10001))).toBe(false)
    })

    it('handles edge cases', () => {
      expect(validateMessage('A'.repeat(10000))).toBe(true) // exactly at limit
      expect(validateMessage('A')).toBe(true) // single character
    })
  })

  describe('validateConversationTitle', () => {
    it('returns true for valid titles', () => {
      expect(validateConversationTitle('My Chat')).toBe(true)
      expect(validateConversationTitle('A'.repeat(50))).toBe(true)
    })

    it('returns false for empty or whitespace-only titles', () => {
      expect(validateConversationTitle('')).toBe(false)
      expect(validateConversationTitle('   ')).toBe(false)
    })

    it('returns false for titles that are too long', () => {
      expect(validateConversationTitle('A'.repeat(101))).toBe(false)
    })

    it('handles edge cases', () => {
      expect(validateConversationTitle('A'.repeat(100))).toBe(true) // exactly at limit
      expect(validateConversationTitle('A')).toBe(true) // single character
    })
  })

  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world')
    })

    it('replaces multiple spaces with single space', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world')
      expect(sanitizeInput('a  b   c    d')).toBe('a b c d')
    })

    it('handles mixed whitespace characters', () => {
      expect(sanitizeInput('hello\t\n world')).toBe('hello world')
    })

    it('returns empty string for whitespace-only input', () => {
      expect(sanitizeInput('   \t\n   ')).toBe('')
    })
  })

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('generates IDs in expected format', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('createErrorMessage', () => {
    it('extracts message from Error objects', () => {
      const error = new Error('Test error message')
      expect(createErrorMessage(error)).toBe('Test error message')
    })

    it('returns string errors as-is', () => {
      expect(createErrorMessage('String error')).toBe('String error')
    })

    it('handles unknown error types', () => {
      expect(createErrorMessage({})).toBe('An unexpected error occurred')
      expect(createErrorMessage(null)).toBe('An unexpected error occurred')
      expect(createErrorMessage(undefined)).toBe('An unexpected error occurred')
    })
  })
})
