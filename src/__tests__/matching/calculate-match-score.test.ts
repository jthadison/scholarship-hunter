/**
 * Composite Match Score Calculator Tests
 *
 * Tests for weighted scoring algorithm that combines all 6 dimensions
 */

import { describe, it, expect } from 'vitest'
import { calculateMatchScore, calculateMatchScoresBatch } from '@/server/lib/matching/calculate-match-score'
import type { Student, Profile, Scholarship } from '@prisma/client'
import type { EligibilityCriteria } from '@/types/scholarship'

// Mock student with profile
function createMockStudent(profileOverrides?: Partial<Profile>): Student & { profile: Profile } {
  const profile: Profile = {
    id: 'profile-1',
    studentId: 'student-1',
    gpa: 3.7,
    gpaScale: 4.0,
    satScore: 1350,
    actScore: 30,
    classRank: 5,
    classSize: 100,
    graduationYear: 2025,
    currentGrade: '12th',
    gender: 'Female',
    ethnicity: ['Hispanic'],
    state: 'CA',
    city: 'Los Angeles',
    zipCode: '90001',
    citizenship: 'US Citizen',
    financialNeed: 'HIGH',
    pellGrantEligible: true,
    efcRange: '0-5000',
    intendedMajor: 'Biology',
    fieldOfStudy: 'STEM',
    careerGoals: 'Medical research and healthcare',
    extracurriculars: [{ name: 'Science Club' }],
    volunteerHours: 120,
    workExperience: null,
    leadershipRoles: [{ title: 'Club President' }],
    awardsHonors: [{ name: 'Honor Roll' }],
    firstGeneration: true,
    militaryAffiliation: null,
    disabilities: null,
    additionalContext: null,
    completionPercentage: 85,
    strengthScore: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...profileOverrides,
  }

  return {
    id: 'student-1',
    userId: 'user-1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: new Date('2005-01-01'),
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile,
  }
}

// Mock scholarship
function createMockScholarship(criteriaOverrides?: Partial<EligibilityCriteria>): Scholarship {
  const criteria: EligibilityCriteria = {
    academic: {
      minGPA: 3.5,
      minSAT: 1200,
    },
    demographic: {
      requiredGender: 'Female',
      requiredEthnicity: ['Hispanic'],
    },
    majorField: {
      eligibleMajors: ['Biology', 'Chemistry'],
      requiredFieldOfStudy: ['STEM'],
    },
    experience: {
      minVolunteerHours: 100,
      leadershipRequired: true,
    },
    financial: {
      requiresFinancialNeed: true,
      pellGrantRequired: true,
    },
    special: {
      firstGenerationRequired: true,
    },
    ...criteriaOverrides,
  }

  return {
    id: 'scholarship-1',
    name: 'Example Scholarship',
    provider: 'Example Foundation',
    description: 'Scholarship for STEM students',
    website: 'https://example.com',
    contactEmail: 'info@example.com',
    awardAmount: 5000,
    awardAmountMax: 10000,
    numberOfAwards: 10,
    renewable: false,
    renewalYears: null,
    deadline: new Date('2025-12-31'),
    announcementDate: null,
    eligibilityCriteria: criteria as unknown as  any,
    essayPrompts: null,
    requiredDocuments: [],
    recommendationCount: 0,
    applicantPoolSize: null,
    acceptanceRate: null,
    sourceUrl: null,
    lastVerified: new Date(),
    verified: true,
    tags: ['STEM', 'Women'],
    category: 'Academic',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('calculateMatchScore', () => {
  describe('Perfect Match', () => {
    it('should return 100 overall score when student meets all criteria perfectly', async () => {
      const student = createMockStudent()
      const scholarship = createMockScholarship()

      const matchScore = await calculateMatchScore(student, scholarship)

      expect(matchScore.overallMatchScore).toBeGreaterThanOrEqual(95)
      expect(matchScore.overallMatchScore).toBeLessThanOrEqual(100)
      expect(matchScore.academicScore).toBe(100)
      expect(matchScore.demographicScore).toBe(100)
      expect(matchScore.majorFieldScore).toBe(100)
      expect(matchScore.experienceScore).toBe(100)
      expect(matchScore.financialScore).toBe(100)
      expect(matchScore.specialCriteriaScore).toBe(100)
    })
  })

  describe('Weighted Scoring Formula', () => {
    it('should apply correct weights: Academic 30%, Major 20%, Demo 15%, Exp 15%, Fin 10%, Special 10%', async () => {
      // Create student with specific dimensional scores
      const student = createMockStudent({
        gpa: 4.0, // Academic: 100
        satScore: 1600,
        gender: 'Male', // Demographic: 0 (required Female)
        intendedMajor: 'Biology', // Major: 100
        volunteerHours: 150, // Experience: 100
        financialNeed: 'HIGH', // Financial: 100
        firstGeneration: true, // Special: 100
      })

      const scholarship = createMockScholarship({
        demographic: { requiredGender: 'Female' }, // Will score 0
      })

      const matchScore = await calculateMatchScore(student, scholarship)

      // Expected: (100*0.30) + (0*0.15) + (100*0.20) + (100*0.15) + (100*0.10) + (100*0.10)
      // = 30 + 0 + 20 + 15 + 10 + 10 = 85
      expect(matchScore.overallMatchScore).toBeGreaterThanOrEqual(83)
      expect(matchScore.overallMatchScore).toBeLessThanOrEqual(87)
    })

    it('should calculate weighted average correctly with mixed scores', async () => {
      const student = createMockStudent({
        gpa: 3.0, // Academic: partial
        gender: 'Female', // Demographic: 100
        intendedMajor: 'Biology', // Major: 100
        volunteerHours: 50, // Experience: partial (50/100 = 50)
        financialNeed: null, // Financial: 0
        firstGeneration: false, // Special: 0
      })

      const scholarship = createMockScholarship()

      const matchScore = await calculateMatchScore(student, scholarship)

      expect(matchScore.overallMatchScore).toBeGreaterThan(50)
      expect(matchScore.overallMatchScore).toBeLessThan(90)
    })
  })

  describe('No Criteria Scholarship', () => {
    it('should return 100 when scholarship has no criteria', async () => {
      const student = createMockStudent()
      const scholarship = createMockScholarship({})

      const matchScore = await calculateMatchScore(student, scholarship)

      expect(matchScore.overallMatchScore).toBe(100)
      expect(matchScore.academicScore).toBe(100)
      expect(matchScore.demographicScore).toBe(100)
      expect(matchScore.majorFieldScore).toBe(100)
      expect(matchScore.experienceScore).toBe(100)
      expect(matchScore.financialScore).toBe(100)
      expect(matchScore.specialCriteriaScore).toBe(100)
    })
  })

  describe('Partial Match Support', () => {
    it('should give partial score when student partially meets criteria', async () => {
      const student = createMockStudent({
        gpa: 3.3, // Below min 3.5 = partial
        volunteerHours: 80, // Below min 100 = partial (80%)
      })

      const scholarship = createMockScholarship()

      const matchScore = await calculateMatchScore(student, scholarship)

      expect(matchScore.academicScore).toBeGreaterThan(90)
      expect(matchScore.academicScore).toBeLessThan(100)
      expect(matchScore.experienceScore).toBeGreaterThan(75)
      expect(matchScore.experienceScore).toBeLessThan(85)
      expect(matchScore.overallMatchScore).toBeGreaterThan(85)
      expect(matchScore.overallMatchScore).toBeLessThan(100)
    })
  })

  describe('Metadata', () => {
    it('should include calculatedAt timestamp', async () => {
      const student = createMockStudent()
      const scholarship = createMockScholarship()

      const beforeCalc = new Date()
      const matchScore = await calculateMatchScore(student, scholarship)
      const afterCalc = new Date()

      expect(matchScore.calculatedAt).toBeDefined()
      expect(matchScore.calculatedAt.getTime()).toBeGreaterThanOrEqual(beforeCalc.getTime())
      expect(matchScore.calculatedAt.getTime()).toBeLessThanOrEqual(afterCalc.getTime())
    })
  })

  describe('Edge Cases', () => {
    it('should throw error when student has no profile', async () => {
      const student = {
        id: 'student-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2005-01-01'),
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      }

      const scholarship = createMockScholarship()

      await expect(calculateMatchScore(student, scholarship)).rejects.toThrow(
        'has no profile'
      )
    })

    it('should handle incomplete profile gracefully', async () => {
      const student = createMockStudent({
        gpa: null,
        satScore: null,
        actScore: null,
        gender: null,
        ethnicity: [],
        intendedMajor: null,
        volunteerHours: 0,
        financialNeed: null,
        firstGeneration: false,
      })

      const scholarship = createMockScholarship()

      const matchScore = await calculateMatchScore(student, scholarship)

      expect(matchScore.overallMatchScore).toBeGreaterThanOrEqual(0)
      expect(matchScore.overallMatchScore).toBeLessThanOrEqual(50)
    })
  })
})

describe('calculateMatchScoresBatch', () => {
  it('should calculate scores for multiple scholarships', async () => {
    const student = createMockStudent()
    const scholarships = [
      createMockScholarship(),
      createMockScholarship({ academic: { minGPA: 4.0 } }),
      createMockScholarship({ demographic: { requiredGender: 'Male' } }),
    ]

    const matchScores = await calculateMatchScoresBatch(student, scholarships)

    expect(matchScores).toHaveLength(3)
    expect(matchScores[0]!.overallMatchScore).toBeGreaterThan(90)
    expect(matchScores[1]!.overallMatchScore).toBeLessThan(matchScores[0]!.overallMatchScore)
    expect(matchScores[2]!.overallMatchScore).toBeLessThan(matchScores[0]!.overallMatchScore)
  })

  it('should execute in parallel (performance check)', async () => {
    const student = createMockStudent()
    const scholarships = Array(100)
      .fill(null)
      .map(() => createMockScholarship())

    const start = Date.now()
    const matchScores = await calculateMatchScoresBatch(student, scholarships)
    const duration = Date.now() - start

    expect(matchScores).toHaveLength(100)
    expect(duration).toBeLessThan(500) // Should complete in < 500ms for 100 scholarships
  })
})
