/**
 * Tests for Competition Factor Calculator
 *
 * Story 2.5: Success Probability Prediction
 * Tests AC#2: Competition factor calculation using acceptance rate and pool size
 */

import { describe, it, expect } from 'vitest'
import { calculateCompetitionFactor } from '@/server/lib/matching/calculate-competition-factor'
import type { Scholarship } from '@prisma/client'

// Helper to create mock scholarship
function createMockScholarship(
  overrides: Partial<Scholarship> = {}
): Scholarship {
  return {
    id: 'test-scholarship-id',
    name: 'Test Scholarship',
    provider: 'Test Provider',
    description: 'Test description',
    website: null,
    contactEmail: null,
    awardAmount: 5000,
    awardAmountMax: null,
    numberOfAwards: 1,
    renewable: false,
    renewalYears: null,
    deadline: new Date(),
    announcementDate: null,
    eligibilityCriteria: {},
    essayPrompts: null,
    requiredDocuments: [],
    recommendationCount: 0,
    applicantPoolSize: null,
    acceptanceRate: null,
    sourceUrl: null,
    lastVerified: new Date(),
    verified: true,
    tags: [],
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('calculateCompetitionFactor', () => {
  describe('Priority 1: Historical acceptance rate', () => {
    it('should use historical acceptance rate when available', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: 0.25,
        applicantPoolSize: 500, // Should be ignored
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.25)
    })

    it('should clamp acceptance rate to minimum 5%', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: 0.01, // 1% - very competitive
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.05) // Clamped to 5%
    })

    it('should clamp acceptance rate to maximum 95%', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: 0.98, // 98% - unrealistic
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.95) // Clamped to 95%
    })
  })

  describe('Priority 2: Applicant pool size estimation', () => {
    it('should estimate from small pool size (10 applicants)', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 10,
        numberOfAwards: 1,
      })

      const result = calculateCompetitionFactor(scholarship)
      // min(0.8, 100/10) = min(0.8, 10) = 0.8
      expect(result).toBe(0.8)
    })

    it('should estimate from medium pool size (500 applicants)', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 500,
        numberOfAwards: 1,
      })

      const result = calculateCompetitionFactor(scholarship)
      // min(0.8, 100/500) = min(0.8, 0.2) = 0.2
      expect(result).toBe(0.2)
    })

    it('should estimate from large pool size (10000 applicants)', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 10000,
        numberOfAwards: 1,
      })

      const result = calculateCompetitionFactor(scholarship)
      // min(0.8, 100/10000) = min(0.8, 0.01) = 0.01 → clamped to 0.05
      expect(result).toBe(0.05)
    })

    it('should scale by number of awards', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 500,
        numberOfAwards: 5, // 5 winners
      })

      const result = calculateCompetitionFactor(scholarship)
      // min(0.8, 500/500) = min(0.8, 1) = 0.8
      expect(result).toBe(0.8)
    })

    it('should handle very large number of awards', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 100,
        numberOfAwards: 50, // Half the applicants win
      })

      const result = calculateCompetitionFactor(scholarship)
      // min(0.8, 5000/100) = min(0.8, 50) = 0.8 (capped)
      expect(result).toBe(0.8)
    })
  })

  describe('Priority 3: Default fallback', () => {
    it('should use 30% default when no data available', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: null,
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.3)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero applicant pool size', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 0,
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.3) // Falls back to default
    })

    it('should handle zero number of awards', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: null,
        applicantPoolSize: 500,
        numberOfAwards: 0,
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.05) // Minimum rate
    })

    it('should handle negative acceptance rate (invalid data)', () => {
      const scholarship = createMockScholarship({
        acceptanceRate: -0.1,
      })

      const result = calculateCompetitionFactor(scholarship)
      expect(result).toBe(0.05) // Clamped to minimum
    })
  })
})
