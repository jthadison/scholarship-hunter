/**
 * At-Risk Detection Algorithm Tests
 * Story 3.10 - Task 9, Subtask 9.1 (AC #1)
 *
 * Tests all three at-risk detection criteria:
 * - Rule 1: Deadline <7 days AND progress <50%
 * - Rule 2: Deadline <3 days AND incomplete requirements
 * - Rule 3: Deadline <1 day AND status not READY_FOR_REVIEW/SUBMITTED
 */

import { describe, it, expect } from 'vitest'
import { addDays } from 'date-fns'
import {
  detectAtRiskApplications,
  calculateProgress,
} from '@/lib/at-risk/detection'
import type { Application, Scholarship, ApplicationStatus } from '@prisma/client'

// Helper to create mock application
function createMockApplication(
  overrides: Partial<Application> = {},
  deadlineDaysFromNow: number = 5
): Application & { scholarship: Scholarship } {
  const baseApplication: Application = {
    id: 'test-app-1',
    studentId: 'test-student-1',
    scholarshipId: 'test-scholarship-1',
    status: 'IN_PROGRESS' as ApplicationStatus,
    priorityTier: 'MUST_APPLY',
    essayCount: 2,
    essayComplete: 0,
    documentsRequired: 2,
    documentsUploaded: 0,
    recsRequired: 2,
    recsReceived: 0,
    progressPercentage: 0,
    dateAdded: new Date(),
    targetSubmitDate: addDays(new Date(), deadlineDaysFromNow),
    actualSubmitDate: null,
    outcomeDate: null,
    awardAmount: null,
    notes: null,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }

  const scholarship: Scholarship = {
    id: 'test-scholarship-1',
    name: 'Test Scholarship',
    provider: 'Test Provider',
    awardAmount: 5000,
    deadline: addDays(new Date(), deadlineDaysFromNow),
    category: 'STEM',
    verified: true,
    description: 'Test description',
    eligibilityCriteria: null,
    essayPrompts: null,
    requiredDocuments: null,
    recommendationCount: 2,
    applicationUrl: 'https://test.com',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...({} as any), // Additional scholarship fields
  }

  return {
    ...baseApplication,
    scholarship,
  }
}

describe('calculateProgress', () => {
  it('should calculate 0% progress when nothing is complete', () => {
    const app = createMockApplication({
      essayCount: 2,
      essayComplete: 0,
      documentsRequired: 2,
      documentsUploaded: 0,
      recsRequired: 2,
      recsReceived: 0,
    })

    expect(calculateProgress(app)).toBe(0)
  })

  it('should calculate 100% progress when everything is complete', () => {
    const app = createMockApplication({
      essayCount: 2,
      essayComplete: 2,
      documentsRequired: 2,
      documentsUploaded: 2,
      recsRequired: 2,
      recsReceived: 2,
    })

    expect(calculateProgress(app)).toBe(100)
  })

  it('should use weighted formula (essays 50%, docs 30%, recs 20%)', () => {
    const app = createMockApplication({
      essayCount: 2,
      essayComplete: 1, // 50% essays = 25 points
      documentsRequired: 2,
      documentsUploaded: 2, // 100% docs = 30 points
      recsRequired: 2,
      recsReceived: 0, // 0% recs = 0 points
    })

    // Expected: (50 * 0.5) + (100 * 0.3) + (0 * 0.2) = 25 + 30 + 0 = 55
    expect(calculateProgress(app)).toBe(55)
  })

  it('should handle division by zero (no requirements)', () => {
    const app = createMockApplication({
      essayCount: 0,
      essayComplete: 0,
      documentsRequired: 0,
      documentsUploaded: 0,
      recsRequired: 0,
      recsReceived: 0,
    })

    // When no requirements, all progress should be 100%
    expect(calculateProgress(app)).toBe(100)
  })
})

describe('detectAtRiskApplications - Rule 1: 7-day warning', () => {
  it('should flag application with deadline <7 days and progress <50%', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 2,
        documentsUploaded: 1,
        documentsRequired: 2,
      },
      5 // 5 days until deadline
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('SEVEN_DAY_LOW_PROGRESS')
    expect(result[0].severity).toBe('WARNING')
    expect(result[0].daysUntilDeadline).toBe(5)
  })

  it('should NOT flag application with deadline <7 days but progress >=50%', () => {
    const app = createMockApplication(
      {
        essayComplete: 2, // 100% essays = 50 points
        essayCount: 2,
        documentsUploaded: 2, // 100% docs = 30 points
        documentsRequired: 2,
        recsReceived: 0, // 0% recs = 0 points
        // Total progress = 80% (above 50% threshold)
      },
      5
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })

  it('should NOT flag if deadline >7 days', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 2,
      },
      10 // 10 days until deadline
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })
})

describe('detectAtRiskApplications - Rule 2: 3-day urgent', () => {
  it('should flag application with deadline <3 days and incomplete essays', () => {
    const app = createMockApplication(
      {
        essayComplete: 1,
        essayCount: 2,
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 2,
        recsRequired: 2,
      },
      2 // 2 days until deadline
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('THREE_DAY_INCOMPLETE')
    expect(result[0].severity).toBe('URGENT')
  })

  it('should flag application with deadline <3 days and incomplete documents', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 0,
        documentsRequired: 2,
        recsReceived: 2,
        recsRequired: 2,
      },
      2
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('THREE_DAY_INCOMPLETE')
  })

  it('should flag application with deadline <3 days and incomplete recommendations', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 1,
        recsRequired: 2,
      },
      2
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('THREE_DAY_INCOMPLETE')
  })

  it('should NOT flag if all requirements complete', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 2,
        recsRequired: 2,
      },
      2
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })
})

describe('detectAtRiskApplications - Rule 3: 1-day critical', () => {
  it('should flag application with deadline <1 day and status not READY_FOR_REVIEW', () => {
    const app = createMockApplication(
      {
        status: 'IN_PROGRESS',
      },
      0 // Deadline today
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('ONE_DAY_NOT_READY')
    expect(result[0].severity).toBe('CRITICAL')
  })

  it('should NOT flag if status is READY_FOR_REVIEW', () => {
    const app = createMockApplication(
      {
        status: 'READY_FOR_REVIEW',
      },
      0
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })

  it('should NOT flag if status is SUBMITTED', () => {
    const app = createMockApplication(
      {
        status: 'SUBMITTED',
      },
      0
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })
})

describe('detectAtRiskApplications - Skip conditions', () => {
  it('should skip applications with passed deadlines', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 2,
      },
      -2 // 2 days ago
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })

  it('should skip SUBMITTED applications', () => {
    const app = createMockApplication(
      {
        status: 'SUBMITTED',
        essayComplete: 0,
        essayCount: 2,
      },
      5
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })

  it('should skip WITHDRAWN applications', () => {
    const app = createMockApplication(
      {
        status: 'WITHDRAWN',
        essayComplete: 0,
        essayCount: 2,
      },
      5
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })

  it('should skip AWARDED applications', () => {
    const app = createMockApplication(
      {
        status: 'AWARDED',
        essayComplete: 0,
        essayCount: 2,
      },
      5
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })

  it('should skip DENIED applications', () => {
    const app = createMockApplication(
      {
        status: 'DENIED',
        essayComplete: 0,
        essayCount: 2,
      },
      5
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(0)
  })
})

describe('detectAtRiskApplications - Priority ordering', () => {
  it('should prioritize Rule 3 (critical) over Rule 2 (urgent)', () => {
    const app = createMockApplication(
      {
        status: 'IN_PROGRESS',
        essayComplete: 0,
        essayCount: 2,
      },
      0 // Matches both Rule 2 and Rule 3
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('ONE_DAY_NOT_READY') // Rule 3 takes precedence
    expect(result[0].severity).toBe('CRITICAL')
  })

  it('should prioritize Rule 2 (urgent) over Rule 1 (warning)', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 2,
      },
      2 // Matches both Rule 1 and Rule 2
    )

    const result = detectAtRiskApplications([app])

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('THREE_DAY_INCOMPLETE') // Rule 2 takes precedence
    expect(result[0].severity).toBe('URGENT')
  })
})

describe('detectAtRiskApplications - Multiple applications', () => {
  it('should detect multiple at-risk applications', () => {
    const apps = [
      createMockApplication({ essayComplete: 0, essayCount: 2 }, 5), // Rule 1
      createMockApplication({ essayComplete: 1, essayCount: 2 }, 2), // Rule 2
      createMockApplication({ status: 'IN_PROGRESS' }, 0), // Rule 3
    ]

    const result = detectAtRiskApplications(apps)

    expect(result).toHaveLength(3)
  })

  it('should only return at-risk applications from mixed list', () => {
    const apps = [
      createMockApplication({ essayComplete: 0, essayCount: 2 }, 5), // At risk
      createMockApplication({ essayComplete: 2, essayCount: 2 }, 10), // Not at risk (>7 days)
      createMockApplication({ status: 'SUBMITTED' }, 2), // Not at risk (submitted)
    ]

    const result = detectAtRiskApplications(apps)

    expect(result).toHaveLength(1)
    expect(result[0].atRiskReason).toBe('SEVEN_DAY_LOW_PROGRESS')
  })
})
