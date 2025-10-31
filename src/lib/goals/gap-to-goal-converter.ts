/**
 * Gap to Goal Converter
 *
 * Converts gap analysis recommendations to goal creation parameters.
 * Enables "Convert to Goal" functionality from gap analysis.
 *
 * Story 5.4: Profile Improvement Tracker (Task 8)
 * @module lib/goals/gap-to-goal-converter
 */

import { GoalType } from '@prisma/client'
import type { Gap } from '@/lib/gap-analysis/types'

/**
 * Goal creation parameters extracted from gap
 */
export interface GoalFromGap {
  goalType: GoalType
  targetValue: number
  currentValue: number
  notes: string
}

/**
 * Convert gap analysis recommendation to goal parameters
 *
 * Maps gap field types to goal types and extracts target/current values.
 *
 * @param gap - Gap from gap analysis
 * @param currentProfile - Current profile data
 * @returns Goal creation parameters or null if not convertible
 */
export function convertGapToGoal(gap: Gap): GoalFromGap | null {
  const requirement = gap.requirement.toLowerCase()

  // GPA improvements
  if (requirement.includes('gpa')) {
    return {
      goalType: GoalType.GPA_IMPROVEMENT,
      targetValue: typeof gap.targetValue === 'number' ? gap.targetValue : 0,
      currentValue: typeof gap.currentValue === 'number' ? gap.currentValue : 0,
      notes: `Increase GPA to ${gap.targetValue} to qualify for ${gap.scholarshipsAffected} more scholarships (${gap.impact})`,
    }
  }

  // Volunteer hours
  if (requirement.includes('volunteer')) {
    return {
      goalType: GoalType.VOLUNTEER_HOURS,
      targetValue: typeof gap.targetValue === 'number' ? gap.targetValue : 0,
      currentValue: typeof gap.currentValue === 'number' ? gap.currentValue : 0,
      notes: `Reach ${gap.targetValue} volunteer hours to qualify for ${gap.scholarshipsAffected} more scholarships (${gap.impact})`,
    }
  }

  // Leadership positions
  if (requirement.includes('leadership')) {
    const currentCount = typeof gap.currentValue === 'number' ? gap.currentValue : 0
    const targetCount = typeof gap.targetValue === 'number' ? gap.targetValue : 1

    return {
      goalType: GoalType.LEADERSHIP_POSITION,
      targetValue: targetCount,
      currentValue: currentCount,
      notes: `Obtain ${targetCount} leadership position(s) to qualify for ${gap.scholarshipsAffected} more scholarships (${gap.impact})`,
    }
  }

  // Extracurricular activities
  if (requirement.includes('extracurricular')) {
    return {
      goalType: GoalType.EXTRACURRICULAR,
      targetValue: typeof gap.targetValue === 'number' ? gap.targetValue : 0,
      currentValue: typeof gap.currentValue === 'number' ? gap.currentValue : 0,
      notes: `Join ${gap.targetValue} extracurricular activities to qualify for ${gap.scholarshipsAffected} more scholarships (${gap.impact})`,
    }
  }

  // Test scores (SAT/ACT)
  if (requirement.includes('sat')) {
    return {
      goalType: GoalType.TEST_SCORE,
      targetValue: typeof gap.targetValue === 'number' ? gap.targetValue : 0,
      currentValue: typeof gap.currentValue === 'number' ? gap.currentValue : 0,
      notes: `Achieve ${gap.targetValue}+ SAT score to qualify for ${gap.scholarshipsAffected} more scholarships (${gap.impact})`,
    }
  }

  if (requirement.includes('act')) {
    return {
      goalType: GoalType.TEST_SCORE,
      targetValue: typeof gap.targetValue === 'number' ? gap.targetValue : 0,
      currentValue: typeof gap.currentValue === 'number' ? gap.currentValue : 0,
      notes: `Achieve ${gap.targetValue}+ ACT score to qualify for ${gap.scholarshipsAffected} more scholarships (${gap.impact})`,
    }
  }

  // Field not convertible to goal
  return null
}

/**
 * Check if a gap can be converted to a goal
 *
 * Some gaps are not actionable as goals (e.g., demographic requirements).
 *
 * @param gap - Gap to check
 * @returns True if gap can be converted to goal
 */
export function isGapConvertibleToGoal(gap: Gap): boolean {
  const requirement = gap.requirement.toLowerCase()
  const convertibleKeywords = [
    'gpa',
    'volunteer',
    'leadership',
    'extracurricular',
    'sat',
    'act',
  ]

  return convertibleKeywords.some((keyword) => requirement.includes(keyword))
}

/**
 * Get all convertible gaps from gap analysis result
 *
 * Filters gaps to only those that can be converted to goals.
 *
 * @param gaps - Array of gaps from gap analysis
 * @returns Array of convertible gaps
 */
export function getConvertibleGaps(gaps: Gap[]): Gap[] {
  return gaps.filter(isGapConvertibleToGoal)
}
