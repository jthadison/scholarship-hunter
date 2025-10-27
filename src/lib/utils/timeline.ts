/**
 * Timeline Generation Utilities
 *
 * Provides timeline calculation functions for scholarship applications.
 * Sprint 1 version uses fixed-offset algorithm.
 * Will be enhanced in Story 3.5 with complexity-based dynamic calculation.
 *
 * @module lib/utils/timeline
 */

import { subDays, differenceInDays } from 'date-fns'
import type { Application, Scholarship } from '@prisma/client'

/**
 * Timeline data structure
 */
export interface TimelineData {
  submitDate: Date
  finalReviewDate: Date
  uploadDocsDate: Date
  requestRecsDate: Date | null
  startEssayDate: Date
  estimatedHours: number
  hasConflicts: boolean
  conflictsWith: string[]
}

/**
 * Generate timeline stub with fixed offsets (Sprint 1 version)
 *
 * Uses simple backward planning from deadline with fixed time offsets.
 * This is a simplified version - will be enhanced in Story 3.5 with:
 * - Complexity-based calculation
 * - Conflict detection across applications
 * - Dynamic milestone adjustment
 *
 * @param application - Application record with scholarship data
 * @returns Timeline data with milestone dates
 */
export function generateTimelineStub(
  application: Application & { scholarship: Scholarship }
): TimelineData {
  const deadline = application.scholarship.deadline

  // Fixed offset timeline (Sprint 1 version)
  const submitDate = subDays(deadline, 1)
  const finalReviewDate = subDays(deadline, 3)
  const uploadDocsDate = subDays(deadline, 7)

  // Only set rec request date if recommendations required
  const requestRecsDate =
    application.recsRequired > 0 ? subDays(deadline, 14) : null

  // Fixed 3-week lead time for essay start
  const startEssayDate = subDays(deadline, 21)

  // Placeholder estimated hours (will be calculated dynamically in Story 3.5)
  const estimatedHours = 10

  return {
    submitDate,
    finalReviewDate,
    uploadDocsDate,
    requestRecsDate,
    startEssayDate,
    estimatedHours,
    hasConflicts: false, // Conflict detection in Story 3.5
    conflictsWith: [],
  }
}

/**
 * Calculate days until deadline
 *
 * @param deadline - Target deadline date
 * @returns Number of days until deadline
 */
export function calculateDaysUntilDeadline(deadline: Date): number {
  return differenceInDays(deadline, new Date())
}

/**
 * Format days until deadline for display
 *
 * @param deadline - Target deadline date
 * @returns Formatted string (e.g., "45 days", "1 day", "Today", "Overdue")
 */
export function formatDaysUntilDeadline(deadline: Date): string {
  const days = calculateDaysUntilDeadline(deadline)

  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}
