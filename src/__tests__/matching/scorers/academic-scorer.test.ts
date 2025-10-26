/**
 * Academic Scorer Tests
 *
 * Tests for academic dimension scoring with:
 * - GPA requirements (min/max)
 * - SAT requirements (min/max)
 * - ACT requirements (min/max)
 * - Class rank percentile
 * - Partial match support
 * - Edge cases
 */

import { describe, it, expect } from 'vitest'
import { calculateAcademicMatch } from '@/server/lib/matching/scorers/academic-scorer'
import type { Profile } from '@prisma/client'
import type { AcademicCriteria } from '@/types/scholarship'

// Helper to create mock profile
function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: 'profile-1',
    studentId: 'student-1',
    gpa: 3.5,
    gpaScale: 4.0,
    satScore: 1200,
    actScore: 28,
    classRank: 10,
    classSize: 100,
    graduationYear: 2025,
    currentGrade: '12th',
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
    completionPercentage: 0,
    strengthScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('calculateAcademicMatch', () => {
  describe('No Criteria', () => {
    it('should return 100 when no academic criteria specified', () => {
      const profile = createMockProfile()
      const score = calculateAcademicMatch(profile, undefined)
      expect(score).toBe(100)
    })

    it('should return 100 when criteria is empty object', () => {
      const profile = createMockProfile()
      const score = calculateAcademicMatch(profile, {})
      expect(score).toBe(100)
    })
  })

  describe('GPA Scoring', () => {
    it('should return 100 when GPA meets minimum requirement', () => {
      const profile = createMockProfile({ gpa: 3.7 })
      const criteria: AcademicCriteria = { minGPA: 3.5 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100)
    })

    it('should return 100 when GPA exceeds minimum requirement', () => {
      const profile = createMockProfile({ gpa: 4.0 })
      const criteria: AcademicCriteria = { minGPA: 3.5 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100)
    })

    it('should return partial score when GPA is below minimum', () => {
      const profile = createMockProfile({ gpa: 3.3 })
      const criteria: AcademicCriteria = { minGPA: 3.5 }
      const score = calculateAcademicMatch(profile, criteria)
      // 3.3 / 3.5 = 0.9428... = 94.28% ≈ 94
      expect(score).toBeGreaterThan(90)
      expect(score).toBeLessThan(100)
    })

    it('should return 0 when GPA is null and required', () => {
      const profile = createMockProfile({ gpa: null })
      const criteria: AcademicCriteria = { minGPA: 3.0 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(0)
    })

    it('should handle maximum GPA requirement (need-based)', () => {
      const profile = createMockProfile({ gpa: 3.2 })
      const criteria: AcademicCriteria = { maxGPA: 3.5 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100)
    })

    it('should penalize GPA above maximum', () => {
      const profile = createMockProfile({ gpa: 3.8 })
      const criteria: AcademicCriteria = { maxGPA: 3.5 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBeLessThan(100)
    })
  })

  describe('SAT Scoring', () => {
    it('should return 100 when SAT meets minimum requirement', () => {
      const profile = createMockProfile({ satScore: 1350 })
      const criteria: AcademicCriteria = { minSAT: 1200 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100)
    })

    it('should return partial score when SAT is below minimum', () => {
      const profile = createMockProfile({ satScore: 1200 })
      const criteria: AcademicCriteria = { minSAT: 1400 }
      const score = calculateAcademicMatch(profile, criteria)
      // 1200 / 1400 = 0.857... = 85.7% ≈ 86
      expect(score).toBeGreaterThan(80)
      expect(score).toBeLessThan(90)
    })

    it('should return 0 when SAT is null and required', () => {
      const profile = createMockProfile({ satScore: null })
      const criteria: AcademicCriteria = { minSAT: 1200 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(0)
    })
  })

  describe('ACT Scoring', () => {
    it('should return 100 when ACT meets minimum requirement', () => {
      const profile = createMockProfile({ actScore: 30 })
      const criteria: AcademicCriteria = { minACT: 28 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100)
    })

    it('should return partial score when ACT is below minimum', () => {
      const profile = createMockProfile({ actScore: 26 })
      const criteria: AcademicCriteria = { minACT: 28 }
      const score = calculateAcademicMatch(profile, criteria)
      // 26 / 28 = 0.9285... = 92.85% ≈ 93
      expect(score).toBeGreaterThan(90)
      expect(score).toBeLessThan(96)
    })

    it('should return 0 when ACT is null and required', () => {
      const profile = createMockProfile({ actScore: null })
      const criteria: AcademicCriteria = { minACT: 28 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(0)
    })
  })

  describe('Class Rank Scoring', () => {
    it('should return 100 when class rank meets percentile', () => {
      // Rank 5 out of 100 = Top 5%
      const profile = createMockProfile({ classRank: 5, classSize: 100 })
      const criteria: AcademicCriteria = { classRankPercentile: 10 } // Top 10% required
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100)
    })

    it('should return partial score when class rank below percentile', () => {
      // Rank 15 out of 100 = Top 15%
      const profile = createMockProfile({ classRank: 15, classSize: 100 })
      const criteria: AcademicCriteria = { classRankPercentile: 10 } // Top 10% required
      const score = calculateAcademicMatch(profile, criteria)
      // (10 / 15) * 100 = 66.67
      expect(score).toBeGreaterThan(60)
      expect(score).toBeLessThan(70)
    })

    it('should return 0 when class rank is null', () => {
      const profile = createMockProfile({ classRank: null, classSize: 100 })
      const criteria: AcademicCriteria = { classRankPercentile: 10 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(0)
    })
  })

  describe('Combined Criteria', () => {
    it('should weight GPA and SAT together', () => {
      const profile = createMockProfile({ gpa: 3.7, satScore: 1350 })
      const criteria: AcademicCriteria = { minGPA: 3.5, minSAT: 1200 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100) // Both meet requirements
    })

    it('should handle partial match on one criterion', () => {
      const profile = createMockProfile({ gpa: 3.3, satScore: 1350 }) // GPA below, SAT above
      const criteria: AcademicCriteria = { minGPA: 3.5, minSAT: 1200 }
      const score = calculateAcademicMatch(profile, criteria)
      // Should be < 100 due to partial GPA match
      expect(score).toBeGreaterThan(90)
      expect(score).toBeLessThan(100)
    })

    it('should handle all three test score types', () => {
      const profile = createMockProfile({ gpa: 3.8, satScore: 1400, actScore: 32 })
      const criteria: AcademicCriteria = { minGPA: 3.5, minSAT: 1300, minACT: 30 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(100) // All exceed requirements
    })
  })

  describe('Edge Cases', () => {
    it('should handle profile with no academic data', () => {
      const profile = createMockProfile({
        gpa: null,
        satScore: null,
        actScore: null,
        classRank: null,
      })
      const criteria: AcademicCriteria = { minGPA: 3.0 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBe(0)
    })

    it('should handle very low partial match', () => {
      const profile = createMockProfile({ gpa: 2.0 })
      const criteria: AcademicCriteria = { minGPA: 4.0 }
      const score = calculateAcademicMatch(profile, criteria)
      // 2.0 / 4.0 = 50%
      expect(score).toBe(50)
    })

    it('should not go below 0', () => {
      const profile = createMockProfile({ gpa: 0.5 })
      const criteria: AcademicCriteria = { minGPA: 4.0 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should not exceed 100', () => {
      const profile = createMockProfile({ gpa: 4.0, satScore: 1600, actScore: 36 })
      const criteria: AcademicCriteria = { minGPA: 2.0, minSAT: 900, minACT: 20 }
      const score = calculateAcademicMatch(profile, criteria)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})
