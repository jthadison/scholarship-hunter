/**
 * Analytics Calculator Tests
 *
 * Tests for analytics calculation functions
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (Task 10)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import {
  calculateSuccessMetrics,
  calculateROI,
} from '../calculator'

// Mock Prisma
const mockPrisma = {
  application: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  essay: {
    count: vi.fn(),
  },
  document: {
    count: vi.fn(),
  },
  outcome: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

describe('Analytics Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateSuccessMetrics', () => {
    it('should calculate metrics with 0 applications', async () => {
      mockPrisma.application.findMany = vi.fn().mockResolvedValue([])

      const result = await calculateSuccessMetrics(mockPrisma, 'student-1')

      expect(result.totalApplications).toBe(0)
      expect(result.totalAwarded).toBe(0)
      expect(result.successRate).toBe(0)
      expect(result.totalFundingSecured).toBe(0)
    })

    it('should calculate success rate correctly', async () => {
      const mockApplications = [
        { outcome: { result: 'AWARDED', awardAmountReceived: 5000 }, status: 'AWARDED' },
        { outcome: { result: 'AWARDED', awardAmountReceived: 3000 }, status: 'AWARDED' },
        { outcome: { result: 'DENIED' }, status: 'DENIED' },
        { outcome: { result: 'DENIED' }, status: 'DENIED' },
      ]

      mockPrisma.application.findMany = vi.fn().mockResolvedValue(mockApplications)

      const result = await calculateSuccessMetrics(mockPrisma, 'student-1')

      expect(result.totalApplications).toBe(4)
      expect(result.totalAwarded).toBe(2)
      expect(result.totalDenied).toBe(2)
      expect(result.successRate).toBe(0.5) // 2/4 = 50%
      expect(result.totalFundingSecured).toBe(8000)
      expect(result.averageAwardAmount).toBe(4000) // 8000/2
    })
  })

  describe('calculateROI', () => {
    it('should calculate ROI with zero time invested', async () => {
      mockPrisma.essay.count = vi.fn().mockResolvedValue(0)
      mockPrisma.application.count = vi.fn().mockResolvedValue(0)
      mockPrisma.document.count = vi.fn().mockResolvedValue(0)
      mockPrisma.outcome.findMany = vi.fn().mockResolvedValue([])

      const result = await calculateROI(mockPrisma, 'student-1')

      expect(result.timeInvested).toBe(0)
      expect(result.hourlyRate).toBe(0)
    })

    it('should calculate hourly rate correctly', async () => {
      mockPrisma.essay.count = vi.fn().mockResolvedValue(2) // 2 essays × 3 hrs = 6 hrs
      mockPrisma.application.count = vi.fn().mockResolvedValue(5) // 5 apps × 1 hr = 5 hrs
      mockPrisma.document.count = vi.fn().mockResolvedValue(4) // 4 docs × 0.5 hrs = 2 hrs
      // Total: 13 hours
      mockPrisma.outcome.findMany = vi.fn().mockResolvedValue([
        { awardAmountReceived: 10000 },
        { awardAmountReceived: 3000 },
      ]) // Total: $13,000

      const result = await calculateROI(mockPrisma, 'student-1')

      expect(result.timeInvested).toBe(13)
      expect(result.fundingSecured).toBe(13000)
      expect(result.hourlyRate).toBe(1000) // $13,000 / 13 hrs = $1,000/hr
    })
  })
})
