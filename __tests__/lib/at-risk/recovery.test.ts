/**
 * Recovery Recommendation Tests
 * Story 3.10 - Task 9, Subtask 9.4 (AC #4)
 *
 * Tests recovery plan generation with prioritized recommendations
 */

import { describe, it, expect } from 'vitest'
import { addHours } from 'date-fns'
import {
  generateRecoveryPlan,
  calculateRequiredPace,
  getQuinnMessage,
} from '@/lib/at-risk/recovery'
import type { Application, Scholarship } from '@prisma/client'

// Helper to create mock application
function createMockApplication(
  overrides: Partial<Application> = {},
  deadlineHoursFromNow: number = 24
): Application & { scholarship: Scholarship } {
  const deadline = addHours(new Date(), deadlineHoursFromNow)

  const baseApplication: Application = {
    id: 'test-app-1',
    studentId: 'test-student-1',
    scholarshipId: 'test-scholarship-1',
    status: 'IN_PROGRESS',
    priorityTier: 'MUST_APPLY',
    essayCount: 2,
    essayComplete: 0,
    documentsRequired: 2,
    documentsUploaded: 0,
    recsRequired: 2,
    recsReceived: 0,
    progressPercentage: 0,
    dateAdded: new Date(),
    targetSubmitDate: deadline,
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
    deadline,
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
    ...({} as any),
  }

  return {
    ...baseApplication,
    scholarship,
  }
}

describe('generateRecoveryPlan', () => {
  it('should generate essay recommendation when essays incomplete', () => {
    const app = createMockApplication(
      {
        essayComplete: 1,
        essayCount: 3, // 2 essays remaining
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 2,
        recsRequired: 2,
      },
      48 // 48 hours until deadline
    )

    const plan = generateRecoveryPlan(app)

    expect(plan).toHaveLength(1)
    expect(plan[0]!.type).toBe('ESSAY')
    expect(plan[0]!.priority).toBe(1)
    expect(plan[0]!.blockerLevel).toBe('HIGH')
    expect(plan[0]!.estimatedHours).toBe(6) // 2 essays * 3 hours
    expect(plan[0]!.message).toContain('2 essays')
  })

  it('should generate document recommendation when docs incomplete', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 1,
        documentsRequired: 3, // 2 docs remaining
        recsReceived: 2,
        recsRequired: 2,
      },
      48
    )

    const plan = generateRecoveryPlan(app)

    expect(plan).toHaveLength(1)
    expect(plan[0]!.type).toBe('DOCUMENT')
    expect(plan[0]!.priority).toBe(2)
    expect(plan[0]!.blockerLevel).toBe('MEDIUM')
    expect(plan[0]!.message).toContain('2 remaining documents')
  })

  it('should generate recommendation follow-up when recs incomplete', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 0,
        recsRequired: 2, // 2 recs remaining
      },
      48
    )

    const plan = generateRecoveryPlan(app)

    expect(plan).toHaveLength(1)
    expect(plan[0]!.type).toBe('RECOMMENDATION')
    expect(plan[0]!.priority).toBe(3)
    expect(plan[0]!.blockerLevel).toBe('HIGH') // High because outside student control
    expect(plan[0]!.estimatedHours).toBe(0)
    expect(plan[0]!.message).toContain('2 recommenders')
  })

  it('should prioritize essays over docs over recs', () => {
    const app = createMockApplication(
      {
        essayComplete: 1,
        essayCount: 2, // 1 essay remaining
        documentsUploaded: 1,
        documentsRequired: 2, // 1 doc remaining
        recsReceived: 1,
        recsRequired: 2, // 1 rec remaining
      },
      48
    )

    const plan = generateRecoveryPlan(app)

    expect(plan).toHaveLength(3)
    expect(plan[0]!.type).toBe('ESSAY') // Priority 1
    expect(plan[1]!.type).toBe('DOCUMENT') // Priority 2
    expect(plan[2]!.type).toBe('RECOMMENDATION') // Priority 3
  })

  it('should return empty plan when all requirements complete', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 2,
        recsRequired: 2,
      },
      48
    )

    const plan = generateRecoveryPlan(app)

    expect(plan).toHaveLength(0)
  })

  it('should use singular form for single item', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 1, // 1 essay
        documentsUploaded: 1,
        documentsRequired: 2, // 1 doc
        recsReceived: 1,
        recsRequired: 2, // 1 rec
      },
      48
    )

    const plan = generateRecoveryPlan(app)

    expect(plan[0]!.message).toContain('1 essay')
    expect(plan[0]!.message).not.toContain('essays')
    expect(plan[1]!.message).toContain('1 remaining document')
    expect(plan[1]!.message).not.toContain('documents')
    expect(plan[2]!.message).toContain('1 recommender')
    expect(plan[2]!.message).not.toContain('recommenders')
  })

  it('should include deadline in essay recommendation', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 1,
        documentsUploaded: 2,
        documentsRequired: 2,
        recsReceived: 2,
        recsRequired: 2,
      },
      48
    )

    const plan = generateRecoveryPlan(app)

    expect(plan[0]!.deadline).toBeDefined()
    expect(plan[0]!.message).toMatch(/by \w+ \d+:\d+ [AP]M/) // Format check
  })
})

describe('calculateRequiredPace', () => {
  it('should calculate feasible pace when sufficient time', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 2, // 6 hours needed
        documentsUploaded: 0,
        documentsRequired: 2, // 1 hour needed
        // Total: 7 hours needed
      },
      72 // 72 hours remaining
    )

    const pace = calculateRequiredPace(app)

    expect(pace.hoursRemaining).toBe(72)
    expect(pace.hoursNeeded).toBe(7)
    expect(pace.feasible).toBe(true)
    expect(pace.paceDescription).toContain('hours per day')
  })

  it('should flag infeasible when insufficient time', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 5, // 15 hours needed
      },
      10 // Only 10 hours remaining
    )

    const pace = calculateRequiredPace(app)

    expect(pace.feasible).toBe(false)
    expect(pace.paceDescription).toContain('Critical')
  })

  it('should show "all work completed" when nothing remaining', () => {
    const app = createMockApplication(
      {
        essayComplete: 2,
        essayCount: 2,
        documentsUploaded: 2,
        documentsRequired: 2,
      },
      48
    )

    const pace = calculateRequiredPace(app)

    expect(pace.hoursNeeded).toBe(0)
    expect(pace.paceDescription).toBe('All work completed')
  })

  it('should show urgent message when <24 hours remaining', () => {
    const app = createMockApplication(
      {
        essayComplete: 0,
        essayCount: 1, // 3 hours needed
      },
      12 // 12 hours remaining
    )

    const pace = calculateRequiredPace(app)

    expect(pace.feasible).toBe(true)
    expect(pace.paceDescription).toContain('Urgent')
    expect(pace.paceDescription).toContain('12 hours')
  })
})

describe('getQuinnMessage', () => {
  it('should return CRITICAL message for <24 hours', () => {
    const message = getQuinnMessage(0, 'CRITICAL')

    expect(message).toContain('immediate attention')
    expect(message).toContain('less than 24 hours')
  })

  it('should return URGENT message for 3-day threshold', () => {
    const message = getQuinnMessage(2, 'URGENT')

    expect(message).toContain('at risk')
    expect(message).toContain('2 days')
    expect(message).toContain('action plan')
  })

  it('should return WARNING message for 7-day threshold', () => {
    const message = getQuinnMessage(5, 'WARNING')

    expect(message).toContain('5 days')
    expect(message).toContain('timeline')
    expect(message).toContain('behind schedule')
  })
})
