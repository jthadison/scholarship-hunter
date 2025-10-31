/**
 * Goal Impact Calculator
 *
 * Calculates estimated profile strength impact for different goal types.
 * Used to show students how completing goals will improve their profile strength.
 *
 * Story: 5.4 - Profile Improvement Tracker
 * @module lib/goals/impact-calculator
 */

import { GoalType } from '@prisma/client'

/**
 * Impact calculation result
 */
export interface GoalImpact {
  estimatedPoints: number
  goalType: GoalType
  description: string
}

/**
 * Calculate estimated profile strength impact for a goal
 *
 * Formula reference:
 * - GPA_IMPROVEMENT: gpaGain × 50 (0.1 GPA increase = 5 points)
 * - VOLUNTEER_HOURS: hours / 20 (100 hours = 5 points)
 * - LEADERSHIP_POSITION: fixed 12 points
 * - TEST_SCORE: scoreGain / 20 (100 point SAT increase = 5 points)
 * - EXTRACURRICULAR: fixed 8 points per club
 * - CUSTOM: 0 points (user-defined goals don't have automatic impact)
 *
 * @param goalType - Type of goal
 * @param targetValue - Target value for the goal
 * @param currentValue - Current value (optional, defaults to 0)
 * @returns Estimated profile strength impact in points
 */
export function calculateGoalImpact(
  goalType: GoalType,
  targetValue: number,
  currentValue: number = 0
): number {
  const improvement = targetValue - currentValue

  switch (goalType) {
    case GoalType.GPA_IMPROVEMENT:
      // 0.1 GPA increase = 5 points
      // improvement is the GPA gain (e.g., 0.2 for 3.0 → 3.2)
      return improvement * 50

    case GoalType.VOLUNTEER_HOURS:
      // 100 hours = 5 points
      // improvement is the number of hours to add
      return improvement / 20

    case GoalType.LEADERSHIP_POSITION:
      // Fixed impact of 12 points per leadership role
      // targetValue represents number of positions
      return improvement * 12

    case GoalType.TEST_SCORE:
      // 100 point increase = 5 points
      // improvement is the score gain (e.g., 100 for 1400 → 1500 SAT)
      return improvement / 20

    case GoalType.EXTRACURRICULAR:
      // Fixed impact of 8 points per club/activity
      // targetValue represents number of activities
      return improvement * 8

    case GoalType.CUSTOM:
      // Custom goals don't have automatic impact calculation
      return 0

    default:
      return 0
  }
}

/**
 * Get descriptive text for goal impact
 *
 * @param goalType - Type of goal
 * @param estimatedPoints - Estimated impact points
 * @returns Human-readable description of impact
 */
export function getImpactDescription(
  goalType: GoalType,
  estimatedPoints: number
): string {
  const rounded = Math.round(estimatedPoints)

  if (rounded === 0) {
    return 'Impact varies based on individual profile'
  }

  const pointsText = rounded === 1 ? 'point' : 'points'

  switch (goalType) {
    case GoalType.GPA_IMPROVEMENT:
      return `Improving your GPA will increase your profile strength by approximately ${rounded} ${pointsText}`

    case GoalType.VOLUNTEER_HOURS:
      return `Adding volunteer hours will increase your profile strength by approximately ${rounded} ${pointsText}`

    case GoalType.LEADERSHIP_POSITION:
      return `Taking on a leadership role will increase your profile strength by approximately ${rounded} ${pointsText}`

    case GoalType.TEST_SCORE:
      return `Improving your test score will increase your profile strength by approximately ${rounded} ${pointsText}`

    case GoalType.EXTRACURRICULAR:
      return `Joining new activities will increase your profile strength by approximately ${rounded} ${pointsText}`

    case GoalType.CUSTOM:
      return 'Custom goal - impact depends on the nature of your improvement'

    default:
      return `This goal will increase your profile strength by approximately ${rounded} ${pointsText}`
  }
}

/**
 * Get suggested timeline for goal based on type and target value
 *
 * @param goalType - Type of goal
 * @param targetValue - Target value
 * @param currentValue - Current value
 * @returns Suggested number of months to achieve goal
 */
export function getSuggestedTimeline(
  goalType: GoalType,
  targetValue: number,
  currentValue: number = 0
): number {
  const improvement = targetValue - currentValue

  switch (goalType) {
    case GoalType.GPA_IMPROVEMENT:
      // GPA improvements typically take 1-2 semesters
      // Suggest 4 months per 0.1 GPA point
      return Math.max(4, Math.ceil(improvement * 40))

    case GoalType.VOLUNTEER_HOURS:
      // Assume 5 hours per week is reasonable
      // ~20 hours per month
      return Math.max(2, Math.ceil(improvement / 20))

    case GoalType.LEADERSHIP_POSITION:
      // Leadership positions often require 3-6 months to attain
      return improvement * 5

    case GoalType.TEST_SCORE:
      // Test score improvements typically take 2-6 months of prep
      const scoreImprovement = improvement
      if (scoreImprovement < 50) return 2
      if (scoreImprovement < 100) return 3
      if (scoreImprovement < 200) return 4
      return 6

    case GoalType.EXTRACURRICULAR:
      // Can join activities relatively quickly
      // Allow 2 months per activity to get meaningfully involved
      return improvement * 2

    case GoalType.CUSTOM:
      // Default to 6 months for custom goals
      return 6

    default:
      return 6
  }
}

/**
 * Validate goal values
 *
 * @param goalType - Type of goal
 * @param targetValue - Target value
 * @param currentValue - Current value
 * @returns Object with isValid flag and error message if invalid
 */
export function validateGoalValues(
  goalType: GoalType,
  targetValue: number,
  currentValue: number = 0
): { isValid: boolean; error?: string } {
  // Target must be greater than current
  if (targetValue <= currentValue) {
    return {
      isValid: false,
      error: 'Target value must be greater than current value',
    }
  }

  // Type-specific validations
  switch (goalType) {
    case GoalType.GPA_IMPROVEMENT:
      if (targetValue > 4.0) {
        return {
          isValid: false,
          error: 'GPA cannot exceed 4.0',
        }
      }
      if (currentValue < 0 || targetValue < 0) {
        return {
          isValid: false,
          error: 'GPA cannot be negative',
        }
      }
      break

    case GoalType.VOLUNTEER_HOURS:
      if (currentValue < 0 || targetValue < 0) {
        return {
          isValid: false,
          error: 'Volunteer hours cannot be negative',
        }
      }
      if (targetValue > 10000) {
        return {
          isValid: false,
          error: 'Volunteer hours target seems unrealistic (max 10,000)',
        }
      }
      break

    case GoalType.TEST_SCORE:
      // Assume SAT range (400-1600) or ACT range (1-36)
      if (targetValue > 1600) {
        return {
          isValid: false,
          error: 'Test score target exceeds typical maximum (1600 for SAT)',
        }
      }
      if (currentValue < 0 || targetValue < 0) {
        return {
          isValid: false,
          error: 'Test scores cannot be negative',
        }
      }
      break

    case GoalType.LEADERSHIP_POSITION:
    case GoalType.EXTRACURRICULAR:
      if (currentValue < 0 || targetValue < 0) {
        return {
          isValid: false,
          error: 'Count cannot be negative',
        }
      }
      if (targetValue > 20) {
        return {
          isValid: false,
          error: 'Target seems unrealistic (max 20)',
        }
      }
      break
  }

  return { isValid: true }
}

/**
 * Get goal type display name
 *
 * @param goalType - Type of goal
 * @returns Human-readable goal type name
 */
export function getGoalTypeDisplayName(goalType: GoalType): string {
  switch (goalType) {
    case GoalType.GPA_IMPROVEMENT:
      return 'GPA Improvement'
    case GoalType.VOLUNTEER_HOURS:
      return 'Volunteer Hours'
    case GoalType.LEADERSHIP_POSITION:
      return 'Leadership Position'
    case GoalType.TEST_SCORE:
      return 'Test Score'
    case GoalType.EXTRACURRICULAR:
      return 'Extracurricular Activity'
    case GoalType.CUSTOM:
      return 'Custom Goal'
    default:
      return 'Goal'
  }
}

/**
 * Get goal value unit (for display)
 *
 * @param goalType - Type of goal
 * @returns Unit string (e.g., "GPA", "hours", "activities")
 */
export function getGoalValueUnit(goalType: GoalType): string {
  switch (goalType) {
    case GoalType.GPA_IMPROVEMENT:
      return 'GPA'
    case GoalType.VOLUNTEER_HOURS:
      return 'hours'
    case GoalType.LEADERSHIP_POSITION:
      return 'positions'
    case GoalType.TEST_SCORE:
      return 'points'
    case GoalType.EXTRACURRICULAR:
      return 'activities'
    case GoalType.CUSTOM:
      return 'units'
    default:
      return 'units'
  }
}
