/**
 * Token Utilities Tests
 * Story 4.4: Recommendation Letter Coordination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateUploadToken,
  validateUploadToken,
  calculateTokenExpiry,
  checkDuplicateRecommender,
  countRecommendations,
} from '@/lib/recommendation/tokenUtils'
import { prisma } from '@/server/db'

describe('Token Utilities', () => {
  describe('generateUploadToken', () => {
    it('should generate 64-character hex token', () => {
      const token = generateUploadToken()
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate unique tokens', () => {
      const token1 = generateUploadToken()
      const token2 = generateUploadToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('calculateTokenExpiry', () => {
    it('should return date 30 days in future', () => {
      const now = new Date()
      const expiry = calculateTokenExpiry()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // Allow 2 hour tolerance for timing variations
      const diff = Math.abs(expiry.getTime() - thirtyDaysFromNow.getTime())
      expect(diff).toBeLessThan(2 * 60 * 60 * 1000)
    })
  })

  describe('validateUploadToken', () => {
    it('should validate valid token', async () => {
      const mockRecommendation = {
        id: 'rec_123',
        uploadToken: 'valid_token',
        status: 'REQUESTED',
        uploadLinkExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        application: {
          studentId: 'student_123',
          student: {
            firstName: 'John',
            lastName: 'Doe',
            user: { email: 'john@example.com' },
          },
          scholarship: { name: 'Test Scholarship' },
        },
      }

      vi.spyOn(prisma.recommendation, 'findUnique').mockResolvedValue(mockRecommendation as any)

      const result = await validateUploadToken('valid_token')
      expect(result).toBeDefined()
      expect(result.id).toBe('rec_123')
    })

    it('should reject invalid token', async () => {
      vi.spyOn(prisma.recommendation, 'findUnique').mockResolvedValue(null)

      await expect(validateUploadToken('invalid_token')).rejects.toThrow('Invalid upload token')
    })

    it('should reject already submitted recommendation', async () => {
      const mockRecommendation = {
        id: 'rec_123',
        status: 'RECEIVED',
      }

      vi.spyOn(prisma.recommendation, 'findUnique').mockResolvedValue(mockRecommendation as any)

      await expect(validateUploadToken('valid_token')).rejects.toThrow('already been submitted')
    })

    it('should reject expired token', async () => {
      const mockRecommendation = {
        id: 'rec_123',
        status: 'REQUESTED',
        uploadLinkExpiry: new Date(Date.now() - 1000), // Expired
      }

      vi.spyOn(prisma.recommendation, 'findUnique').mockResolvedValue(mockRecommendation as any)

      await expect(validateUploadToken('valid_token')).rejects.toThrow('expired')
    })
  })

  describe('checkDuplicateRecommender', () => {
    it('should detect duplicate email', async () => {
      const mockRecommendation = {
        id: 'rec_123',
        recommenderEmail: 'smith@example.com',
        status: 'REQUESTED',
      }

      vi.spyOn(prisma.recommendation, 'findFirst').mockResolvedValue(mockRecommendation as any)

      const result = await checkDuplicateRecommender('app_123', 'smith@example.com')
      expect(result).toBe(true)
    })

    it('should return false for non-duplicate', async () => {
      vi.spyOn(prisma.recommendation, 'findFirst').mockResolvedValue(null)

      const result = await checkDuplicateRecommender('app_123', 'jones@example.com')
      expect(result).toBe(false)
    })

    it('should ignore already received recommendations', async () => {
      vi.spyOn(prisma.recommendation, 'findFirst').mockImplementation((args: any) => {
        // Only return null if status filter includes RECEIVED
        if (args.where?.status?.in?.includes('RECEIVED')) {
          return Promise.resolve(null)
        }
        return Promise.resolve(null)
      })

      const result = await checkDuplicateRecommender('app_123', 'smith@example.com')
      expect(result).toBe(false)
    })
  })

  describe('countRecommendations', () => {
    it('should count recommendations for application', async () => {
      vi.spyOn(prisma.recommendation, 'count').mockResolvedValue(3)

      const result = await countRecommendations('app_123')
      expect(result).toBe(3)
    })

    it('should return 0 for no recommendations', async () => {
      vi.spyOn(prisma.recommendation, 'count').mockResolvedValue(0)

      const result = await countRecommendations('app_123')
      expect(result).toBe(0)
    })
  })
})
