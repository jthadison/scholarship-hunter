/**
 * Story 3.4: Deadline Alert Service Tests
 *
 * Tests for JWT token generation/verification and urgency level calculation
 *
 * @module __tests__/server/services/email/deadline-alert
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock Resend before importing the module
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
}))

// Set test env vars
beforeAll(() => {
  process.env.RESEND_API_KEY = 'test-key'
  process.env.JWT_SECRET = 'test-secret'
})

import {
  calculateUrgencyLevel,
  verifyActionToken,
} from '@/server/services/email/deadline-alert'

describe('calculateUrgencyLevel', () => {
  it('should return INFO for 30 days remaining', () => {
    expect(calculateUrgencyLevel(30)).toBe('INFO')
  })

  it('should return INFO for 14 days remaining', () => {
    expect(calculateUrgencyLevel(14)).toBe('INFO')
  })

  it('should return WARNING for 7 days remaining', () => {
    expect(calculateUrgencyLevel(7)).toBe('WARNING')
  })

  it('should return URGENT for 3 days remaining', () => {
    expect(calculateUrgencyLevel(3)).toBe('URGENT')
  })

  it('should return URGENT for 2 days remaining', () => {
    expect(calculateUrgencyLevel(2)).toBe('URGENT')
  })

  it('should return CRITICAL for 1 day remaining', () => {
    expect(calculateUrgencyLevel(1)).toBe('CRITICAL')
  })

  it('should return CRITICAL for day-of deadline', () => {
    expect(calculateUrgencyLevel(0)).toBe('CRITICAL')
  })

  it('should handle edge cases correctly', () => {
    // Just above threshold should be previous level
    expect(calculateUrgencyLevel(15)).toBe('INFO')
    expect(calculateUrgencyLevel(8)).toBe('WARNING')
    expect(calculateUrgencyLevel(4)).toBe('URGENT')
  })
})

describe('verifyActionToken', () => {
  it('should return null for invalid token', () => {
    const result = verifyActionToken('invalid-token')
    expect(result).toBeNull()
  })

  it('should return null for malformed token', () => {
    const result = verifyActionToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
    expect(result).toBeNull()
  })

  it('should return null for empty token', () => {
    const result = verifyActionToken('')
    expect(result).toBeNull()
  })

  // Note: Testing valid tokens would require exposing the generateActionToken function
  // or using a test-specific JWT secret. This is left for integration tests.
})
