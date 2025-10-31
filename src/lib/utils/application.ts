/**
 * Application Utility Functions (Story 3.3)
 *
 * Provides utility functions for application management:
 * - isAtRisk: Detect at-risk applications
 * - groupByStatus: Group applications by status for Kanban board
 * - getColumnStatus: Map application status to Kanban column
 */

import { differenceInDays } from 'date-fns'
import type { Application, Scholarship, ApplicationStatus } from '@prisma/client'

/**
 * Column statuses for Kanban board
 */
export type ColumnStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'SUBMITTED'

/**
 * Detect if an application is at-risk
 *
 * An application is at-risk if:
 * - Deadline is less than 7 days away AND
 * - Progress is less than 50%
 *
 * @param application - Application with scholarship relation
 * @returns true if application is at-risk
 */
export function isAtRisk(
  application: Application & { scholarship: Pick<Scholarship, 'deadline'> }
): boolean {
  const daysRemaining = differenceInDays(
    new Date(application.scholarship.deadline),
    new Date()
  )
  return daysRemaining < 7 && application.progressPercentage < 50
}

/**
 * Map ApplicationStatus to Kanban column status
 *
 * Column mapping:
 * - BACKLOG: NOT_STARTED
 * - TODO: TODO
 * - IN_PROGRESS: IN_PROGRESS, READY_FOR_REVIEW
 * - SUBMITTED: SUBMITTED, AWAITING_DECISION, AWARDED, DENIED, WITHDRAWN
 *
 * @param status - Application status
 * @returns Kanban column status
 */
export function getColumnStatus(status: ApplicationStatus): ColumnStatus {
  switch (status) {
    case 'NOT_STARTED':
      return 'BACKLOG'
    case 'TODO':
      return 'TODO'
    case 'IN_PROGRESS':
    case 'READY_FOR_REVIEW':
      return 'IN_PROGRESS'
    case 'SUBMITTED':
    case 'AWAITING_DECISION':
    case 'AWARDED':
    case 'DENIED':
    case 'WAITLISTED': // Story 5.1: WAITLISTED goes to SUBMITTED column
    case 'WITHDRAWN':
      return 'SUBMITTED'
    default:
      return 'BACKLOG'
  }
}

/**
 * Group applications by Kanban column status
 *
 * @param applications - Array of applications
 * @returns Record of applications grouped by column status
 */
export function groupByStatus<
  T extends Application & { scholarship: Pick<Scholarship, 'deadline'> }
>(applications: T[]): Record<ColumnStatus, T[]> {
  const grouped: Record<ColumnStatus, T[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    SUBMITTED: [],
  }

  applications.forEach((app) => {
    const columnStatus = getColumnStatus(app.status)
    grouped[columnStatus].push(app)
  })

  return grouped
}

/**
 * Calculate deadline urgency level
 *
 * @param deadline - Scholarship deadline
 * @returns Urgency level: 'critical' (<3 days), 'urgent' (<7 days), 'normal' (>=7 days)
 */
export function getDeadlineUrgency(
  deadline: Date | string
): 'critical' | 'urgent' | 'normal' {
  const daysRemaining = differenceInDays(new Date(deadline), new Date())

  if (daysRemaining < 3) return 'critical'
  if (daysRemaining < 7) return 'urgent'
  return 'normal'
}

/**
 * Get count of at-risk applications
 *
 * @param applications - Array of applications
 * @returns Number of at-risk applications
 */
export function getAtRiskCount<
  T extends Application & { scholarship: Pick<Scholarship, 'deadline'> }
>(applications: T[]): number {
  return applications.filter((app) => isAtRisk(app)).length
}

/**
 * Get status display text
 *
 * @param status - Application status
 * @returns Human-readable status text
 */
export function getStatusText(status: ApplicationStatus): string {
  switch (status) {
    case 'NOT_STARTED':
      return 'Not Started'
    case 'TODO':
      return 'To Do'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'READY_FOR_REVIEW':
      return 'Ready for Review'
    case 'SUBMITTED':
      return 'Submitted'
    case 'AWAITING_DECISION':
      return 'Awaiting Decision'
    case 'AWARDED':
      return 'Awarded'
    case 'DENIED':
      return 'Denied'
    case 'WAITLISTED': // Story 5.1
      return 'Waitlisted'
    case 'WITHDRAWN':
      return 'Withdrawn'
    default:
      return status
  }
}

/**
 * Get status badge color
 *
 * @param status - Application status
 * @returns Badge color variant
 */
export function getStatusColor(
  status: ApplicationStatus
): 'blue' | 'yellow' | 'purple' | 'green' | 'gray' {
  switch (status) {
    case 'NOT_STARTED':
    case 'TODO':
      return 'blue'
    case 'IN_PROGRESS':
      return 'yellow'
    case 'READY_FOR_REVIEW':
      return 'purple'
    case 'SUBMITTED':
    case 'AWAITING_DECISION':
      return 'green'
    case 'AWARDED':
      return 'green'
    case 'WAITLISTED': // Story 5.1
      return 'yellow'
    case 'DENIED':
    case 'WITHDRAWN':
      return 'gray'
    default:
      return 'blue'
  }
}
