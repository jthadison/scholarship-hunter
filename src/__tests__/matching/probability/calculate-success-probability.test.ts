/**
 * Tests for Success Probability Calculator
 *
 * Story 2.5: Success Probability Prediction
 * Tests AC#1, AC#2, AC#5: Probability calculation with match score, competition, and profile strength
 */

import { describe, it, expect } from 'vitest'
import { calculateSuccessProbability, calculateSuccessProbabilityDetailed } from '@/server/lib/matching/calculate-success-probability'
import type { Profile, Scholarship } from '@prisma/client'

// Helper to create mock profile
function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'test-profile-id',
    studentId: 'test-student-id',
    gpa: 3.5,
    gpaScale: 4.0,
    satScore: null,
    actScore: null,
    classRank: null,
    classSize: null,
    graduationYear: 2025,
    currentGrade: '12',
    gender: null,
    ethnicity: [],
    state: null,
    city: null,
    zipCode: null,
    citizenship: null,
    financialNeed: null,
    pellGrantEligible: false,
    efcRange: null,
    intendedMajor: null,
    fieldOfStudy: null,
    careerGoals: null,
    extracurriculars: null,
    volunteerHours: 0,
    workExperience: null,
    leadershipRoles: null,
    awardsHonors: null,
    firstGeneration: false,
    militaryAffiliation: null,
    disabilities: null,
    additionalContext: null,
    completionPercentage: 80,
    strengthScore: 50, // Default average strength
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Helper to create mock scholarship
function createMockScholarship(overrides: Partial<Scholarship> = {}): Scholarship {
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

describe('calculateSuccessProbability', () => {
  describe('AC#1: Base probability from match score', () => {
    it('should calculate base probability from match score', () => {
      const profile = createMockProfile({ strengthScore: 50 }) // Average strength (no adjustment)
      const scholarship = createMockScholarship({ acceptanceRate: 0.95 }) // 95% acceptance (max clamped)

      const result = calculateSuccessProbability(88, profile, scholarship)

      // 88 match score → 0.88 base → 0.95 competition → 0.836 → no strength adjustment → 84%
      expect(result).toBe(84)
    })

    it('should handle 0 match score', () => {
      const profile = createMockProfile({ strengthScore: 50 })
      const scholarship = createMockScholarship({ acceptanceRate: 0.5 })

      const result = calculateSuccessProbability(0, profile, scholarship)

      // 0 match score → 0% base → with strength adjustment → clamped to min 5%
      expect(result).toBe(5)
    })

    it('should handle 100 match score', () => {
      const profile = createMockProfile({ strengthScore: 50 })
      const scholarship = createMockScholarship({ acceptanceRate: 1.0 })

      const result = calculateSuccessProbability(100, profile, scholarship)

      // 100 match score → 100% → clamped to max 95%
      expect(result).toBe(95)
    })
  })

  describe('AC#2: Competition factor adjustment', () => {
    it('should reduce probability for competitive scholarships', () => {
      const profile = createMockProfile({ strengthScore: 50 })
      const scholarship = createMockScholarship({
        applicantPoolSize: 1000,
        acceptanceRate: 0.1, // 10% acceptance - very competitive
      })

      const result = calculateSuccessProbability(80, profile, scholarship)

      // 80 match score → 0.8 base → 0.1 competition → 0.08 (8%) → no strength adjustment → 8%
      expect(result).toBe(8)
    })

    it('should increase probability for less competitive scholarships', () => {
      const profile = createMockProfile({ strengthScore: 50 })
      const scholarship = createMockScholarship({
        acceptanceRate: 0.8, // 80% acceptance - not very competitive
      })

      const result = calculateSuccessProbability(80, profile, scholarship)

      // 80% base → 0.8 competition factor → 64%
      expect(result).toBeGreaterThan(60)
      expect(result).toBeLessThan(70)
    })
  })

  describe('AC#5: Profile strength adjustment', () => {
    it('should increase probability for strong profiles', () => {
      const strongProfile = createMockProfile({ strengthScore: 80 }) // Well above average
      const weakProfile = createMockProfile({ strengthScore: 50 }) // Average
      const scholarship = createMockScholarship({ acceptanceRate: 0.5 })

      const strongResult = calculateSuccessProbability(70, strongProfile, scholarship)
      const weakResult = calculateSuccessProbability(70, weakProfile, scholarship)

      // Strong profile should have higher probability
      expect(strongResult).toBeGreaterThan(weakResult)
    })

    it('should decrease probability for weak profiles', () => {
      const weakProfile = createMockProfile({ strengthScore: 20 }) // Well below average
      const averageProfile = createMockProfile({ strengthScore: 50 }) // Average
      const scholarship = createMockScholarship({ acceptanceRate: 0.5 })

      const weakResult = calculateSuccessProbability(70, weakProfile, scholarship)
      const averageResult = calculateSuccessProbability(70, averageProfile, scholarship)

      // Weak profile should have lower probability
      expect(weakResult).toBeLessThan(averageResult)
    })

    it('should calculate correct strength adjustment', () => {
      const profile = createMockProfile({ strengthScore: 60 }) // 10 points above baseline
      const scholarship = createMockScholarship({ acceptanceRate: 0.95 }) // Max competition factor

      const result = calculateSuccessProbability(50, profile, scholarship)

      // 50 match → 0.5 base → 0.95 competition → 0.475 → +(60-50)/100=+0.1 → 0.575 → rounds to 57%
      expect(result).toBe(57)
    })
  })

  describe('Probability clamping', () => {
    it('should clamp minimum probability to 5%', () => {
      const profile = createMockProfile({ strengthScore: 0 }) // Very weak
      const scholarship = createMockScholarship({ acceptanceRate: 0.01 }) // 1% acceptance

      const result = calculateSuccessProbability(10, profile, scholarship)

      expect(result).toBeGreaterThanOrEqual(5)
    })

    it('should clamp maximum probability to 95%', () => {
      const profile = createMockProfile({ strengthScore: 100 }) // Very strong
      const scholarship = createMockScholarship({ acceptanceRate: 1.0 }) // 100% acceptance

      const result = calculateSuccessProbability(100, profile, scholarship)

      expect(result).toBeLessThanOrEqual(95)
    })
  })

  describe('Integration: Realistic scenarios', () => {
    it('should calculate realistic probability for strong student + competitive scholarship', () => {
      const profile = createMockProfile({ strengthScore: 85 })
      const scholarship = createMockScholarship({
        applicantPoolSize: 500,
        acceptanceRate: 0.2, // 20% acceptance
      })

      const result = calculateSuccessProbability(88, profile, scholarship)

      // High match (88) + competition (0.2) + strong profile (+35)
      // Expect result in "Competitive Match" range (40-69%)
      expect(result).toBeGreaterThan(40)
      expect(result).toBeLessThan(100)
    })

    it('should calculate realistic probability for average student + easy scholarship', () => {
      const profile = createMockProfile({ strengthScore: 50 })
      const scholarship = createMockScholarship({
        applicantPoolSize: 50,
        numberOfAwards: 10, // 20% acceptance estimate
      })

      const result = calculateSuccessProbability(75, profile, scholarship)

      // Good match (75) + low competition + average profile
      // Expect result in "Strong Match" or high "Competitive Match" range
      expect(result).toBeGreaterThan(50)
    })
  })
})

describe('calculateSuccessProbabilityDetailed', () => {
  it('should return detailed breakdown with all factors', () => {
    const profile = createMockProfile({ strengthScore: 82 })
    const scholarship = createMockScholarship({
      applicantPoolSize: 500,
      acceptanceRate: 0.74,
    })

    const result = calculateSuccessProbabilityDetailed(88, profile, scholarship)

    expect(result).toHaveProperty('finalProbability')
    expect(result).toHaveProperty('baseProbability')
    expect(result).toHaveProperty('afterCompetition')
    expect(result).toHaveProperty('afterStrengthAdjustment')
    expect(result).toHaveProperty('competitionFactor')
    expect(result).toHaveProperty('strengthAdjustment')

    expect(result.baseProbability).toBe(88)
    expect(result.competitionFactor).toBe(0.74)
  })

  it('should show progression through calculation steps', () => {
    const profile = createMockProfile({ strengthScore: 60 })
    const scholarship = createMockScholarship({ acceptanceRate: 0.5 })

    const result = calculateSuccessProbabilityDetailed(80, profile, scholarship)

    // Base should be highest
    expect(result.baseProbability).toBe(80)

    // After competition should be lower (0.5 factor)
    expect(result.afterCompetition).toBeLessThan(result.baseProbability)

    // After strength adjustment should be higher (60 > 50 baseline)
    expect(result.afterStrengthAdjustment).toBeGreaterThan(result.afterCompetition)
  })
})
