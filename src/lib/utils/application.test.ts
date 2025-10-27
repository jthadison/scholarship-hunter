/**
 * Application Utility Functions Tests (Story 3.3)
 *
 * Tests for utility functions:
 * - isAtRisk: At-risk detection logic
 * - groupByStatus: Application grouping
 * - getColumnStatus: Status-to-column mapping
 */

import { describe, it, expect } from 'vitest'
import { addDays, subDays } from 'date-fns'
import {
  isAtRisk,
  groupByStatus,
  getColumnStatus,
  getDeadlineUrgency,
  getAtRiskCount,
  getStatusText,
  getStatusColor,
} from './application'
import type { Application, Scholarship } from '@prisma/client'

/**
 * Helper: Create mock application
 */
function createMockApplication(
  overrides: Partial<Application & { scholarship: Partial<Scholarship> }> = {}
): Application & { scholarship: Pick<Scholarship, 'deadline'> } {
  return {
    id: 'app1',
    studentId: 'student1',
    scholarshipId: 'sch1',
    status: 'TODO',
    priorityTier: null,
    essayCount: 2,
    essayComplete: 0,
    documentsRequired: 3,
    documentsUploaded: 0,
    recsRequired: 2,
    recsReceived: 0,
    progressPercentage: 0,
    dateAdded: new Date(),
    targetSubmitDate: null,
    actualSubmitDate: null,
    outcomeDate: null,
    awardAmount: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    scholarship: {
      deadline: addDays(new Date(), 30),
      ...overrides.scholarship,
    },
    ...overrides,
  } as Application & { scholarship: Pick<Scholarship, 'deadline'> }
}

describe('isAtRisk', () => {
  it('should return true for application with deadline <7 days and progress <50%', () => {
    const app = createMockApplication({
      scholarship: { deadline: addDays(new Date(), 5) },
      progressPercentage: 30,
    })

    expect(isAtRisk(app)).toBe(true)
  })

  it('should return false for application with deadline <7 days but progress >=50%', () => {
    const app = createMockApplication({
      scholarship: { deadline: addDays(new Date(), 5) },
      progressPercentage: 60,
    })

    expect(isAtRisk(app)).toBe(false)
  })

  it('should return false for application with deadline >=7 days even if progress <50%', () => {
    const app = createMockApplication({
      scholarship: { deadline: addDays(new Date(), 10) },
      progressPercentage: 30,
    })

    expect(isAtRisk(app)).toBe(false)
  })

  it('should return false for deadline exactly 7 days with progress <50% (boundary)', () => {
    const app = createMockApplication({
      scholarship: { deadline: addDays(new Date(), 7) },
      progressPercentage: 40,
    })

    expect(isAtRisk(app)).toBe(false)
  })

  it('should return false for deadline <7 days with progress exactly 50% (boundary)', () => {
    const app = createMockApplication({
      scholarship: { deadline: addDays(new Date(), 5) },
      progressPercentage: 50,
    })

    expect(isAtRisk(app)).toBe(false)
  })

  it('should return true for past deadline with progress <50%', () => {
    const app = createMockApplication({
      scholarship: { deadline: subDays(new Date(), 1) },
      progressPercentage: 30,
    })

    expect(isAtRisk(app)).toBe(true)
  })
})

describe('getColumnStatus', () => {
  it('should map NOT_STARTED to BACKLOG', () => {
    expect(getColumnStatus('NOT_STARTED')).toBe('BACKLOG')
  })

  it('should map TODO to TODO', () => {
    expect(getColumnStatus('TODO')).toBe('TODO')
  })

  it('should map IN_PROGRESS to IN_PROGRESS', () => {
    expect(getColumnStatus('IN_PROGRESS')).toBe('IN_PROGRESS')
  })

  it('should map READY_FOR_REVIEW to IN_PROGRESS', () => {
    expect(getColumnStatus('READY_FOR_REVIEW')).toBe('IN_PROGRESS')
  })

  it('should map SUBMITTED to SUBMITTED', () => {
    expect(getColumnStatus('SUBMITTED')).toBe('SUBMITTED')
  })

  it('should map AWAITING_DECISION to SUBMITTED', () => {
    expect(getColumnStatus('AWAITING_DECISION')).toBe('SUBMITTED')
  })

  it('should map AWARDED to SUBMITTED', () => {
    expect(getColumnStatus('AWARDED')).toBe('SUBMITTED')
  })

  it('should map DENIED to SUBMITTED', () => {
    expect(getColumnStatus('DENIED')).toBe('SUBMITTED')
  })

  it('should map WITHDRAWN to SUBMITTED', () => {
    expect(getColumnStatus('WITHDRAWN')).toBe('SUBMITTED')
  })
})

describe('groupByStatus', () => {
  it('should group applications by column status', () => {
    const apps = [
      createMockApplication({ id: 'app1', status: 'NOT_STARTED' }),
      createMockApplication({ id: 'app2', status: 'TODO' }),
      createMockApplication({ id: 'app3', status: 'IN_PROGRESS' }),
      createMockApplication({ id: 'app4', status: 'SUBMITTED' }),
    ]

    const grouped = groupByStatus(apps)

    expect(grouped.BACKLOG).toHaveLength(1)
    expect(grouped.BACKLOG[0].id).toBe('app1')

    expect(grouped.TODO).toHaveLength(1)
    expect(grouped.TODO[0].id).toBe('app2')

    expect(grouped.IN_PROGRESS).toHaveLength(1)
    expect(grouped.IN_PROGRESS[0].id).toBe('app3')

    expect(grouped.SUBMITTED).toHaveLength(1)
    expect(grouped.SUBMITTED[0].id).toBe('app4')
  })

  it('should group READY_FOR_REVIEW with IN_PROGRESS', () => {
    const apps = [
      createMockApplication({ id: 'app1', status: 'IN_PROGRESS' }),
      createMockApplication({ id: 'app2', status: 'READY_FOR_REVIEW' }),
    ]

    const grouped = groupByStatus(apps)

    expect(grouped.IN_PROGRESS).toHaveLength(2)
    expect(grouped.IN_PROGRESS.map((a) => a.id)).toContain('app1')
    expect(grouped.IN_PROGRESS.map((a) => a.id)).toContain('app2')
  })

  it('should handle empty array', () => {
    const grouped = groupByStatus([])

    expect(grouped.BACKLOG).toEqual([])
    expect(grouped.TODO).toEqual([])
    expect(grouped.IN_PROGRESS).toEqual([])
    expect(grouped.SUBMITTED).toEqual([])
  })
})

describe('getDeadlineUrgency', () => {
  it('should return "critical" for deadline <3 days', () => {
    const deadline = addDays(new Date(), 2)
    expect(getDeadlineUrgency(deadline)).toBe('critical')
  })

  it('should return "urgent" for deadline >=3 days and <7 days', () => {
    const deadline = addDays(new Date(), 5)
    expect(getDeadlineUrgency(deadline)).toBe('urgent')
  })

  it('should return "normal" for deadline >=7 days', () => {
    const deadline = addDays(new Date(), 10)
    expect(getDeadlineUrgency(deadline)).toBe('normal')
  })

  it('should return "critical" for past deadline', () => {
    const deadline = subDays(new Date(), 1)
    expect(getDeadlineUrgency(deadline)).toBe('critical')
  })
})

describe('getAtRiskCount', () => {
  it('should count applications that are at risk', () => {
    const apps = [
      createMockApplication({
        id: 'app1',
        scholarship: { deadline: addDays(new Date(), 5) },
        progressPercentage: 30,
      }), // At risk
      createMockApplication({
        id: 'app2',
        scholarship: { deadline: addDays(new Date(), 5) },
        progressPercentage: 60,
      }), // Not at risk (progress >= 50%)
      createMockApplication({
        id: 'app3',
        scholarship: { deadline: addDays(new Date(), 3) },
        progressPercentage: 20,
      }), // At risk
    ]

    expect(getAtRiskCount(apps)).toBe(2)
  })

  it('should return 0 for empty array', () => {
    expect(getAtRiskCount([])).toBe(0)
  })
})

describe('getStatusText', () => {
  it('should return human-readable status text', () => {
    expect(getStatusText('NOT_STARTED')).toBe('Not Started')
    expect(getStatusText('TODO')).toBe('To Do')
    expect(getStatusText('IN_PROGRESS')).toBe('In Progress')
    expect(getStatusText('READY_FOR_REVIEW')).toBe('Ready for Review')
    expect(getStatusText('SUBMITTED')).toBe('Submitted')
    expect(getStatusText('AWAITING_DECISION')).toBe('Awaiting Decision')
    expect(getStatusText('AWARDED')).toBe('Awarded')
    expect(getStatusText('DENIED')).toBe('Denied')
    expect(getStatusText('WITHDRAWN')).toBe('Withdrawn')
  })
})

describe('getStatusColor', () => {
  it('should return correct color for each status', () => {
    expect(getStatusColor('NOT_STARTED')).toBe('blue')
    expect(getStatusColor('TODO')).toBe('blue')
    expect(getStatusColor('IN_PROGRESS')).toBe('yellow')
    expect(getStatusColor('READY_FOR_REVIEW')).toBe('purple')
    expect(getStatusColor('SUBMITTED')).toBe('green')
    expect(getStatusColor('AWAITING_DECISION')).toBe('green')
    expect(getStatusColor('AWARDED')).toBe('green')
    expect(getStatusColor('DENIED')).toBe('gray')
    expect(getStatusColor('WITHDRAWN')).toBe('gray')
  })
})
