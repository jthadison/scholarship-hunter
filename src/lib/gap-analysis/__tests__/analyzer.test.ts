/**
 * Gap Analysis Algorithm Tests
 *
 * Tests for core gap detection, aggregation, and impact calculation logic.
 *
 * Story: 5.3 - Gap Analysis (AC #1, #2, #3, #6)
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck - Integration test imports kept for future implementation

import { describe, it, expect } from 'vitest'
import type { Profile, Scholarship } from '@prisma/client'
import type { StudentWithProfile } from '@/lib/matching/hard-filter'
import {
  findReachScholarships,
  compareProfileToRequirements,
  aggregateGaps,
  prioritizeGapsByImpact,
  calculateImpactSummary,
} from '../analyzer'

// Mock student profile
const mockProfile: Profile = {
  id: 'profile-1',
  studentId: 'student-1',
  gpa: 3.4,
  gpaScale: 4.0,
  satScore: 1200,
  actScore: 25,
  classRank: null,
  classSize: null,
  graduationYear: 2025,
  currentGrade: '11',
  gender: null,
  ethnicity: [],
  state: 'CA',
  city: null,
  zipCode: null,
  citizenship: null,
  financialNeed: 'MODERATE',
  pellGrantEligible: false,
  efcRange: null,
  intendedMajor: 'Computer Science',
  fieldOfStudy: null,
  careerGoals: null,
  extracurriculars: [],
  volunteerHours: 20,
  workExperience: [],
  leadershipRoles: [],
  awardsHonors: [],
  firstGeneration: false,
  militaryAffiliation: null,
  disabilities: null,
  additionalContext: null,
  completionPercentage: 75,
  strengthScore: 62,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockStudent: StudentWithProfile = {
  id: 'student-1',
  userId: 'user-1',
  firstName: 'Test',
  lastName: 'Student',
  dateOfBirth: new Date('2006-01-01'),
  phone: null,
  profile: mockProfile,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock high-value scholarship with GPA requirement
const mockScholarship: Scholarship = {
  id: 'scholarship-1',
  name: 'Test Merit Scholarship',
  provider: 'Test Foundation',
  description: 'High-value scholarship requiring 3.7 GPA',
  website: null,
  contactEmail: null,
  awardAmount: 10000,
  awardAmountMax: null,
  numberOfAwards: 1,
  renewable: false,
  renewalYears: null,
  deadline: new Date('2025-12-31'),
  announcementDate: null,
  eligibilityCriteria: {
    academic: {
      minGpa: 3.7,
      minSat: null,
      minAct: null,
    },
    demographic: {},
    majorField: {},
    experience: {},
    financial: {},
    special: {},
  },
  essayPrompts: null,
  requiredDocuments: [],
  recommendationCount: 0,
  documentRequirements: null,
  applicantPoolSize: null,
  acceptanceRate: null,
  sourceUrl: null,
  lastVerified: new Date(),
  verified: true,
  tags: [],
  category: 'Academic',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Gap Analysis Analyzer', () => {
  // NOTE: These tests require full integration with hard filter system
  // and database setup. Marked as .todo for future implementation.
  // See: https://github.com/jthadison/scholarship-hunter/issues/XX

  describe.todo('findReachScholarships (integration test)', () => {
    it.todo('should identify scholarships worth ≥$5,000 where student has gaps')
    it.todo('should limit to top 200 reach scholarships sorted by award amount')
  })

  describe.todo('compareProfileToRequirements (integration test)', () => {
    it.todo('should detect GPA gap')
    it.todo('should detect volunteer hours gap')
  })

  describe('aggregateGaps', () => {
    it('should combine similar gaps across multiple scholarships', () => {
      const gaps = [
        {
          category: 'academic' as const,
          requirement: 'GPA 3.7+',
          currentValue: 3.4,
          targetValue: 3.7,
          gapSize: 0.3,
          impact: 'Test impact',
          scholarshipsAffected: 1,
          fundingBlocked: 10000,
          achievability: 'MODERATE' as const,
          timelineMonths: 8,
          affectedScholarshipIds: ['scholarship-1'],
        },
        {
          category: 'academic' as const,
          requirement: 'GPA 3.7+',
          currentValue: 3.4,
          targetValue: 3.7,
          gapSize: 0.3,
          impact: 'Test impact',
          scholarshipsAffected: 1,
          fundingBlocked: 15000,
          achievability: 'MODERATE' as const,
          timelineMonths: 8,
          affectedScholarshipIds: ['scholarship-2'],
        },
      ]

      const aggregated = aggregateGaps(gaps)

      expect(aggregated).toHaveLength(1)
      expect(aggregated[0]?.scholarshipsAffected).toBe(2)
      expect(aggregated[0]?.fundingBlocked).toBe(25000)
      expect(aggregated[0]?.affectedScholarshipIds).toHaveLength(2)
    })
  })

  describe('prioritizeGapsByImpact', () => {
    it('should sort gaps by funding blocked (descending)', () => {
      const gaps = [
        {
          category: 'academic' as const,
          requirement: 'SAT 1400+',
          currentValue: 1200,
          targetValue: 1400,
          gapSize: 200,
          impact: 'Lower impact',
          scholarshipsAffected: 2,
          fundingBlocked: 15000,
          achievability: 'MODERATE' as const,
          timelineMonths: 3,
          affectedScholarshipIds: [],
        },
        {
          category: 'academic' as const,
          requirement: 'GPA 3.7+',
          currentValue: 3.4,
          targetValue: 3.7,
          gapSize: 0.3,
          impact: 'Higher impact',
          scholarshipsAffected: 5,
          fundingBlocked: 50000,
          achievability: 'MODERATE' as const,
          timelineMonths: 8,
          affectedScholarshipIds: [],
        },
      ]

      const prioritized = prioritizeGapsByImpact(gaps)

      expect(prioritized[0]?.fundingBlocked).toBe(50000)
      expect(prioritized[1]?.fundingBlocked).toBe(15000)
    })

    it('should prioritize EASY over MODERATE when funding is equal', () => {
      const gaps = [
        {
          category: 'experience' as const,
          requirement: '50+ volunteer hours',
          currentValue: 20,
          targetValue: 50,
          gapSize: 30,
          impact: 'Test',
          scholarshipsAffected: 3,
          fundingBlocked: 20000,
          achievability: 'MODERATE' as const,
          timelineMonths: 6,
          affectedScholarshipIds: [],
        },
        {
          category: 'experience' as const,
          requirement: '30+ volunteer hours',
          currentValue: 20,
          targetValue: 30,
          gapSize: 10,
          impact: 'Test',
          scholarshipsAffected: 3,
          fundingBlocked: 20000,
          achievability: 'EASY' as const,
          timelineMonths: 3,
          affectedScholarshipIds: [],
        },
      ]

      const prioritized = prioritizeGapsByImpact(gaps)

      expect(prioritized[0]?.achievability).toBe('EASY')
    })
  })

  describe('calculateImpactSummary', () => {
    it('should calculate total scholarships and funding from unique scholarships', () => {
      const gaps = [
        {
          category: 'academic' as const,
          requirement: 'GPA 3.7+',
          currentValue: 3.4,
          targetValue: 3.7,
          gapSize: 0.3,
          impact: 'Test',
          scholarshipsAffected: 5,
          fundingBlocked: 50000,
          achievability: 'MODERATE' as const,
          timelineMonths: 8,
          affectedScholarshipIds: ['s1', 's2', 's3', 's4', 's5'],
        },
        {
          category: 'experience' as const,
          requirement: '100+ volunteer hours',
          currentValue: 20,
          targetValue: 100,
          gapSize: 80,
          impact: 'Test',
          scholarshipsAffected: 3,
          fundingBlocked: 30000,
          achievability: 'LONG_TERM' as const,
          timelineMonths: 12,
          affectedScholarshipIds: ['s4', 's5', 's6'], // s4, s5 overlap
        },
      ]

      const summary = calculateImpactSummary(gaps)

      // Unique scholarships: s1-s6 = 6 total
      expect(summary.scholarshipsUnlockable).toBe(6)
      expect(summary.potentialFunding).toBe(80000)
      expect(summary.averageAward).toBeCloseTo(13333, 0)
      expect(summary.totalGaps).toBe(2)
      expect(summary.gapsByAchievability.easy).toBe(0)
      expect(summary.gapsByAchievability.moderate).toBe(1)
      expect(summary.gapsByAchievability.longTerm).toBe(1)
    })
  })
})
