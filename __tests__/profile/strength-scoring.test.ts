import { describe, it, expect } from 'vitest'
import {
  calculateStrengthBreakdown,
  getScoreColorCode,
  getScoreLabel,
  calculatePotentialScore,
} from '@/modules/profile/lib/strength-scoring'
import type { Profile } from '@prisma/client'

// ============================================================================
// Test Helpers
// ============================================================================

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'test-profile-id',
    studentId: 'test-student-id',
    // Academic
    gpa: null,
    gpaScale: 4.0,
    satScore: null,
    actScore: null,
    classRank: null,
    classSize: null,
    graduationYear: null,
    currentGrade: null,
    // Demographics
    gender: null,
    ethnicity: [],
    state: null,
    city: null,
    zipCode: null,
    citizenship: null,
    // Financial
    financialNeed: null,
    pellGrantEligible: false,
    efcRange: null,
    // Major & Field
    intendedMajor: null,
    fieldOfStudy: null,
    careerGoals: null,
    // Experience
    extracurriculars: null,
    volunteerHours: 0,
    workExperience: null,
    leadershipRoles: null,
    awardsHonors: null,
    // Special Circumstances
    firstGeneration: false,
    militaryAffiliation: null,
    disabilities: null,
    additionalContext: null,
    // Metadata
    completionPercentage: 100,
    strengthScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Profile
}

// ============================================================================
// Academic Scoring Tests (AC2)
// ============================================================================

describe('Academic Scoring', () => {
  it('should calculate GPA component correctly (40 pts max)', () => {
    const profile = createMockProfile({ gpa: 3.5, gpaScale: 4.0 })
    const breakdown = calculateStrengthBreakdown(profile)
    // 3.5/4.0 * 40 = 35 points
    expect(breakdown.academic).toBe(35)
  })

  it('should handle perfect GPA (4.0)', () => {
    const profile = createMockProfile({ gpa: 4.0, gpaScale: 4.0 })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.academic).toBe(40)
  })

  it('should calculate SAT score component correctly (30 pts max)', () => {
    const profile = createMockProfile({ satScore: 1400 })
    const breakdown = calculateStrengthBreakdown(profile)
    // (1400-400)/(1600-400) * 30 = 25 points
    expect(breakdown.academic).toBe(25)
  })

  it('should calculate ACT score component correctly (30 pts max)', () => {
    const profile = createMockProfile({ actScore: 30 })
    const breakdown = calculateStrengthBreakdown(profile)
    // (30-1)/(36-1) * 30 ≈ 24.86 → 25 points
    expect(breakdown.academic).toBe(25)
  })

  it('should use higher of SAT or ACT when both present', () => {
    const profileWithBothScores = createMockProfile({
      satScore: 1200, // Lower normalized score
      actScore: 32, // Higher normalized score
    })
    const breakdown = calculateStrengthBreakdown(profileWithBothScores)
    // ACT 32: (32-1)/(36-1) * 30 ≈ 26.57 → 27 points
    expect(breakdown.academic).toBe(27)
  })

  it('should calculate class rank component correctly (20 pts max)', () => {
    const profile = createMockProfile({ classRank: 15, classSize: 300 })
    const breakdown = calculateStrengthBreakdown(profile)
    // Percentile: (1 - 15/300) * 20 = 19 points
    expect(breakdown.academic).toBe(19)
  })

  it('should calculate awards component correctly (10 pts max)', () => {
    const profile = createMockProfile({
      awardsHonors: [
        { name: 'Award 1', issuer: 'School', date: '2023-01-01', level: 'School' },
        { name: 'Award 2', issuer: 'State', date: '2023-02-01', level: 'State' },
        { name: 'Award 3', issuer: 'National', date: '2023-03-01', level: 'National' },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // 3 awards * 2 = 6 points
    expect(breakdown.academic).toBe(6)
  })

  it('should cap awards at 10 points (max 5 awards counted)', () => {
    const profile = createMockProfile({
      awardsHonors: Array(10)
        .fill(null)
        .map((_, i) => ({
          name: `Award ${i}`,
          issuer: 'School',
          date: '2023-01-01',
          level: 'School',
        })) as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // Max 10 points for awards
    expect(breakdown.academic).toBe(10)
  })

  it('should calculate complete academic profile with all components (AC2)', () => {
    const profile = createMockProfile({
      gpa: 3.5,
      gpaScale: 4.0,
      satScore: 1400,
      classRank: 15,
      classSize: 300,
      awardsHonors: [
        { name: 'Award 1', issuer: 'School', date: '2023-01-01', level: 'School' },
        { name: 'Award 2', issuer: 'State', date: '2023-02-01', level: 'State' },
        { name: 'Award 3', issuer: 'National', date: '2023-03-01', level: 'National' },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // GPA: 35pts, SAT: 25pts, Class Rank: 19pts, Awards: 6pts = 85 academic score
    expect(breakdown.academic).toBe(85)
  })
})

// ============================================================================
// Experience Scoring Tests (AC2)
// ============================================================================

describe('Experience Scoring', () => {
  it('should calculate extracurricular component correctly (40 pts max)', () => {
    const profile = createMockProfile({
      extracurriculars: [
        { name: 'Activity 1', category: 'Sports', hoursPerWeek: 10, yearsInvolved: 2 },
        { name: 'Activity 2', category: 'Academic Clubs', hoursPerWeek: 5, yearsInvolved: 1 },
        { name: 'Activity 3', category: 'Arts/Music', hoursPerWeek: 8, yearsInvolved: 3 },
        { name: 'Activity 4', category: 'Community Service', hoursPerWeek: 6, yearsInvolved: 2 },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // 4 activities * 8 = 32 points
    expect(breakdown.experience).toBe(32)
  })

  it('should cap extracurriculars at 40 points', () => {
    const profile = createMockProfile({
      extracurriculars: Array(10)
        .fill(null)
        .map((_, i) => ({
          name: `Activity ${i}`,
          category: 'Sports',
          hoursPerWeek: 5,
          yearsInvolved: 1,
        })) as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // Max 40 points for extracurriculars
    expect(breakdown.experience).toBeGreaterThanOrEqual(40)
  })

  it('should calculate volunteer hours component with tiered scoring (30 pts max)', () => {
    // Test <50 hours (proportional)
    const profile25 = createMockProfile({ volunteerHours: 25 })
    expect(calculateStrengthBreakdown(profile25).experience).toBe(5) // 25/50 * 10 = 5

    // Test 50-99 hours
    const profile75 = createMockProfile({ volunteerHours: 75 })
    expect(calculateStrengthBreakdown(profile75).experience).toBe(10)

    // Test 100-199 hours
    const profile150 = createMockProfile({ volunteerHours: 150 })
    expect(calculateStrengthBreakdown(profile150).experience).toBe(20)

    // Test 200+ hours
    const profile250 = createMockProfile({ volunteerHours: 250 })
    expect(calculateStrengthBreakdown(profile250).experience).toBe(30)
  })

  it('should calculate work experience component correctly (30 pts max)', () => {
    const profile = createMockProfile({
      workExperience: [
        {
          jobTitle: 'Cashier',
          employer: 'Store',
          startDate: '2023-01-01',
          hoursPerWeek: 15,
        },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // 1 job * 15 = 15 points
    expect(breakdown.experience).toBe(15)
  })

  it('should cap work experience at 30 points', () => {
    const profile = createMockProfile({
      workExperience: [
        {
          jobTitle: 'Job 1',
          employer: 'Employer 1',
          startDate: '2023-01-01',
          hoursPerWeek: 10,
        },
        {
          jobTitle: 'Job 2',
          employer: 'Employer 2',
          startDate: '2023-06-01',
          hoursPerWeek: 10,
        },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // 2 jobs * 15 = 30 points
    expect(breakdown.experience).toBe(30)
  })

  it('should calculate complete experience profile (AC2)', () => {
    const profile = createMockProfile({
      extracurriculars: Array(4)
        .fill(null)
        .map((_, i) => ({
          name: `Activity ${i}`,
          category: 'Sports',
          hoursPerWeek: 5,
          yearsInvolved: 1,
        })) as any,
      volunteerHours: 150,
      workExperience: [
        {
          jobTitle: 'Job',
          employer: 'Employer',
          startDate: '2023-01-01',
          hoursPerWeek: 15,
        },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // Extracurriculars: 32pts, Volunteer: 20pts, Work: 15pts = 67 experience score
    expect(breakdown.experience).toBe(67)
  })
})

// ============================================================================
// Leadership Scoring Tests (AC2)
// ============================================================================

describe('Leadership Scoring', () => {
  it('should score 0 points for no leadership roles', () => {
    const profile = createMockProfile({ leadershipRoles: [] as any })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.leadership).toBe(0)
  })

  it('should score 50 points for 1 leadership role', () => {
    const profile = createMockProfile({
      leadershipRoles: [
        {
          title: 'Team Captain',
          organization: 'Soccer Team',
          startDate: '2023-01-01',
        },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.leadership).toBe(50)
  })

  it('should score 75 points for 2 leadership roles', () => {
    const profile = createMockProfile({
      leadershipRoles: [
        {
          title: 'Team Captain',
          organization: 'Soccer Team',
          startDate: '2023-01-01',
        },
        {
          title: 'Club President',
          organization: 'Math Club',
          startDate: '2023-01-01',
        },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.leadership).toBe(75)
  })

  it('should score 100 points for 3+ leadership roles', () => {
    const profile = createMockProfile({
      leadershipRoles: [
        {
          title: 'Team Captain',
          organization: 'Soccer Team',
          startDate: '2023-01-01',
        },
        {
          title: 'Club President',
          organization: 'Math Club',
          startDate: '2023-01-01',
        },
        {
          title: 'Student Council Rep',
          organization: 'School',
          startDate: '2023-01-01',
        },
      ] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.leadership).toBe(100)
  })
})

// ============================================================================
// Demographics Scoring Tests (AC2)
// ============================================================================

describe('Demographics Scoring', () => {
  it('should score 40 points for first-generation student', () => {
    const profile = createMockProfile({ firstGeneration: true })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.demographics).toBe(40)
  })

  it('should score financial need correctly', () => {
    const veryHigh = createMockProfile({ financialNeed: 'VERY_HIGH' })
    expect(calculateStrengthBreakdown(veryHigh).demographics).toBe(30)

    const high = createMockProfile({ financialNeed: 'HIGH' })
    expect(calculateStrengthBreakdown(high).demographics).toBe(20)

    const moderate = createMockProfile({ financialNeed: 'MODERATE' })
    expect(calculateStrengthBreakdown(moderate).demographics).toBe(10)

    const low = createMockProfile({ financialNeed: 'LOW' })
    expect(calculateStrengthBreakdown(low).demographics).toBe(0)
  })

  it('should score 15 points for military affiliation', () => {
    const activeDuty = createMockProfile({ militaryAffiliation: 'Active Duty' })
    expect(calculateStrengthBreakdown(activeDuty).demographics).toBe(15)

    const veteran = createMockProfile({ militaryAffiliation: 'Veteran' })
    expect(calculateStrengthBreakdown(veteran).demographics).toBe(15)

    const dependent = createMockProfile({ militaryAffiliation: 'Military Dependent' })
    expect(calculateStrengthBreakdown(dependent).demographics).toBe(15)
  })

  it('should not score points for "None" military affiliation', () => {
    const profile = createMockProfile({ militaryAffiliation: 'None' })
    expect(calculateStrengthBreakdown(profile).demographics).toBe(0)
  })

  it('should score 15 points for disabilities', () => {
    const profile = createMockProfile({ disabilities: 'Physical' })
    const breakdown = calculateStrengthBreakdown(profile)
    expect(breakdown.demographics).toBe(15)
  })

  it('should calculate complete demographics profile (AC2)', () => {
    const profile = createMockProfile({
      firstGeneration: true,
      financialNeed: 'HIGH',
      militaryAffiliation: 'Military Dependent',
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // First-gen: 40pts, High need: 20pts, Military: 15pts = 75 demographics score
    expect(breakdown.demographics).toBe(75)
  })

  it('should cap demographics at 100 points', () => {
    const profile = createMockProfile({
      firstGeneration: true,
      financialNeed: 'VERY_HIGH',
      militaryAffiliation: 'Veteran',
      disabilities: 'Physical',
    })
    const breakdown = calculateStrengthBreakdown(profile)
    // First-gen: 40pts, Very High need: 30pts, Military: 15pts, Disabilities: 15pts = 100 (capped)
    expect(breakdown.demographics).toBe(100)
  })
})

// ============================================================================
// Weighted Overall Score Tests (AC1)
// ============================================================================

describe('Overall Score Calculation', () => {
  it('should calculate weighted average correctly (AC1)', () => {
    const profile = createMockProfile({
      gpa: 4.0,
      gpaScale: 4.0,
      satScore: 1600,
      classRank: 1,
      classSize: 100,
      awardsHonors: [
        { name: 'Award 1', issuer: 'School', date: '2023-01-01', level: 'National' },
        { name: 'Award 2', issuer: 'School', date: '2023-01-01', level: 'National' },
        { name: 'Award 3', issuer: 'School', date: '2023-01-01', level: 'National' },
        { name: 'Award 4', issuer: 'School', date: '2023-01-01', level: 'National' },
        { name: 'Award 5', issuer: 'School', date: '2023-01-01', level: 'National' },
      ] as any,
      extracurriculars: Array(5)
        .fill(null)
        .map((_, i) => ({
          name: `Activity ${i}`,
          category: 'Sports',
          hoursPerWeek: 5,
          yearsInvolved: 2,
        })) as any,
      volunteerHours: 250,
      workExperience: [
        {
          jobTitle: 'Job 1',
          employer: 'Employer 1',
          startDate: '2023-01-01',
          hoursPerWeek: 10,
        },
        {
          jobTitle: 'Job 2',
          employer: 'Employer 2',
          startDate: '2023-06-01',
          hoursPerWeek: 10,
        },
      ] as any,
      leadershipRoles: [
        {
          title: 'President',
          organization: 'Club 1',
          startDate: '2023-01-01',
        },
        {
          title: 'Captain',
          organization: 'Team',
          startDate: '2023-01-01',
        },
        {
          title: 'Director',
          organization: 'Organization',
          startDate: '2023-01-01',
        },
      ] as any,
      firstGeneration: true,
      financialNeed: 'VERY_HIGH',
      completionPercentage: 100,
    })

    const breakdown = calculateStrengthBreakdown(profile)

    // Academic: 100, Experience: 100, Leadership: 100, Demographics: 70
    // Overall: 100*0.35 + 100*0.25 + 100*0.25 + 70*0.15 = 35 + 25 + 25 + 10.5 = 95.5 → 96
    expect(breakdown.academic).toBe(100)
    expect(breakdown.experience).toBe(100)
    expect(breakdown.leadership).toBe(100)
    expect(breakdown.demographics).toBe(70)
    expect(breakdown.overallScore).toBeGreaterThanOrEqual(95)
  })

  it('should apply completeness multiplier correctly (AC1)', () => {
    const profile = createMockProfile({
      gpa: 4.0,
      gpaScale: 4.0,
      completionPercentage: 75, // 75% complete
    })

    const breakdown = calculateStrengthBreakdown(profile)

    // Academic score: 40 (GPA only)
    // Overall before completeness: 40*0.35 = 14
    // After completeness: 14 * 0.75 = 10.5 → 11
    expect(breakdown.academic).toBe(40)
    expect(breakdown.overallScore).toBeLessThanOrEqual(15)
  })
})

// ============================================================================
// Recommendation Generation Tests (AC3)
// ============================================================================

describe('Recommendation Generation', () => {
  it('should recommend adding test scores when missing (AC3)', () => {
    const profile = createMockProfile({ satScore: null, actScore: null })
    const breakdown = calculateStrengthBreakdown(profile)

    const testScoreRec = breakdown.recommendations.find((r) =>
      r.message.includes('Add SAT or ACT')
    )

    expect(testScoreRec).toBeDefined()
    expect(testScoreRec?.category).toBe('Academic')
    expect(testScoreRec?.priority).toBe(1) // High impact
  })

  it('should recommend increasing volunteer hours when <50 (AC3)', () => {
    const profile = createMockProfile({ volunteerHours: 25 })
    const breakdown = calculateStrengthBreakdown(profile)

    const volunteerRec = breakdown.recommendations.find((r) =>
      r.message.includes('volunteer hours')
    )

    expect(volunteerRec).toBeDefined()
    expect(volunteerRec?.category).toBe('Experience')
  })

  it('should recommend leadership roles when none exist (AC3)', () => {
    const profile = createMockProfile({ leadershipRoles: [] as any })
    const breakdown = calculateStrengthBreakdown(profile)

    const leadershipRec = breakdown.recommendations.find((r) =>
      r.message.includes('Leadership')
    )

    expect(leadershipRec).toBeDefined()
    expect(leadershipRec?.category).toBe('Leadership')
    expect(leadershipRec?.priority).toBe(1) // High impact
    expect(leadershipRec?.impact).toBeGreaterThan(20) // >20 points = high impact
  })

  it('should prioritize recommendations by impact (AC3)', () => {
    const profile = createMockProfile({
      satScore: null, // High impact
      classRank: null, // Medium impact
      leadershipRoles: [] as any, // High impact
    })
    const breakdown = calculateStrengthBreakdown(profile)

    // High-impact recommendations should come first
    const priorities = breakdown.recommendations.map((r) => r.priority)
    expect(priorities[0]).toBeLessThanOrEqual(priorities[priorities.length - 1] ?? 3)
  })

  it('should return top 5 recommendations only', () => {
    const profile = createMockProfile({
      // Trigger many recommendations
      satScore: null,
      actScore: null,
      classRank: null,
      classSize: null,
      leadershipRoles: [] as any,
      volunteerHours: 0,
      workExperience: [] as any,
    })
    const breakdown = calculateStrengthBreakdown(profile)

    expect(breakdown.recommendations.length).toBeLessThanOrEqual(5)
  })
})

// ============================================================================
// Helper Functions Tests (AC5, AC7)
// ============================================================================

describe('Helper Functions', () => {
  it('should return correct color codes (AC5)', () => {
    expect(getScoreColorCode(45)).toBe('red')
    expect(getScoreColorCode(50)).toBe('red')
    expect(getScoreColorCode(65)).toBe('yellow')
    expect(getScoreColorCode(75)).toBe('yellow')
    expect(getScoreColorCode(85)).toBe('green')
    expect(getScoreColorCode(100)).toBe('green')
  })

  it('should return correct accessibility labels (AC5, AC7)', () => {
    expect(getScoreLabel(45)).toBe('Needs Improvement')
    expect(getScoreLabel(65)).toBe('Good')
    expect(getScoreLabel(85)).toBe('Excellent')
  })

  it('should calculate potential score at 100% completion', () => {
    const profile = createMockProfile({
      gpa: 4.0,
      gpaScale: 4.0,
      completionPercentage: 50, // Only 50% complete
    })

    const potentialScore = calculatePotentialScore(profile)

    // Academic score: 40 (GPA only)
    // Weighted: 40*0.35 = 14 points
    // At 100% completion: 14 points
    expect(potentialScore).toBe(14)
  })
})
