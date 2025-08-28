import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  formatTimestamp, 
  formatDate, 
  isToday, 
  isYesterday, 
  getRelativeTimeString 
} from './date'

describe('date utilities', () => {
  // Mock date to ensure consistent tests
  const mockDate = new Date('2024-01-15T10:30:00.000Z')
  
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  describe('formatTimestamp', () => {
    it('formats timestamp with date and time', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')
      const result = formatTimestamp(date)
      // Format should include date and time
      expect(result).toMatch(/Jan 15, 2024/)
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatDate', () => {
    it('formats date without time', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024/)
      // Should not include time components
      expect(result).not.toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('isToday', () => {
    it('returns true for today\'s date', () => {
      const today = new Date('2024-01-15T16:00:00.000Z')
      expect(isToday(today)).toBe(true)
    })

    it('returns false for yesterday', () => {
      const yesterday = new Date('2024-01-14T10:30:00.000Z')
      expect(isToday(yesterday)).toBe(false)
    })

    it('returns false for tomorrow', () => {
      const tomorrow = new Date('2024-01-16T10:30:00.000Z')
      expect(isToday(tomorrow)).toBe(false)
    })
  })

  describe('isYesterday', () => {
    it('returns true for yesterday\'s date', () => {
      const yesterday = new Date('2024-01-14T16:00:00.000Z')
      expect(isYesterday(yesterday)).toBe(true)
    })

    it('returns false for today', () => {
      const today = new Date('2024-01-15T10:30:00.000Z')
      expect(isYesterday(today)).toBe(false)
    })

    it('returns false for two days ago', () => {
      const twoDaysAgo = new Date('2024-01-13T10:30:00.000Z')
      expect(isYesterday(twoDaysAgo)).toBe(false)
    })
  })

  describe('getRelativeTimeString', () => {
    it('returns "Today" for today\'s date', () => {
      const today = new Date('2024-01-15T16:00:00.000Z')
      expect(getRelativeTimeString(today)).toBe('Today')
    })

    it('returns "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date('2024-01-14T16:00:00.000Z')
      expect(getRelativeTimeString(yesterday)).toBe('Yesterday')
    })

    it('returns formatted date for older dates', () => {
      const older = new Date('2024-01-10T10:30:00.000Z')
      const result = getRelativeTimeString(older)
      expect(result).toMatch(/Jan 10, 2024/)
    })
  })
})
