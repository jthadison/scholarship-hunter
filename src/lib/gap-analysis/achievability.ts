// ============================================================================
// Story 5.3: Achievability Assessment Logic
// ============================================================================

import type { Profile } from '@prisma/client'
import type { AchievabilityCategory, GapCategory } from './types'

/**
 * Achievability assessment result
 */
export interface AchievabilityAssessment {
  /** EASY (1-3 months), MODERATE (3-6 months), or LONG_TERM (6-12+ months) */
  category: AchievabilityCategory

  /** Estimated timeline in months */
  timelineMonths: number

  /** Human-readable timeline description */
  timelineDescription: string
}

/**
 * Assess how achievable it is to close a given gap
 *
 * Uses heuristics based on gap type and size to categorize difficulty
 * and estimate timeline for improvement.
 *
 * @param gap - Gap with category and size information
 * @param profile - Student profile (for context on current state)
 * @returns Achievability assessment with category and timeline
 */
export function assessAchievability(
  gap: { category: GapCategory; gapSize: number },
  profile: Profile
): AchievabilityAssessment {
  const { category, gapSize } = gap

  switch (category) {
    case 'academic':
      return assessAcademicGap(gapSize, profile)

    case 'experience':
      return assessExperienceGap(gapSize, profile)

    case 'major':
      // Major changes are typically not achievable short-term
      return {
        category: 'LONG_TERM',
        timelineMonths: 12,
        timelineDescription: '12+ months (requires sustained commitment)',
      }

    case 'financial':
      // Financial status changes are usually not in student control
      return {
        category: 'LONG_TERM',
        timelineMonths: 12,
        timelineDescription: 'Varies (often outside student control)',
      }

    case 'special':
    case 'demographic':
      // Special circumstances and demographics are typically not changeable
      return {
        category: 'LONG_TERM',
        timelineMonths: 12,
        timelineDescription: 'Not typically actionable',
      }

    default:
      return {
        category: 'MODERATE',
        timelineMonths: 6,
        timelineDescription: '3-6 months',
      }
  }
}

/**
 * Assess academic gap achievability
 *
 * Heuristics:
 * - GPA: ≤0.2 = EASY (1 semester), 0.2-0.5 = MODERATE (2-3 semesters), >0.5 = LONG_TERM (4+ semesters)
 * - Test scores: ≤100 points = MODERATE (retake with prep), >100 = LONG_TERM (extensive prep)
 */
function assessAcademicGap(gapSize: number, _profile: Profile): AchievabilityAssessment {
  // Determine if this is a GPA gap or test score gap by size range
  // GPA gaps are typically 0.0-4.0 range
  // SAT gaps are typically 0-1200 range
  // ACT gaps are typically 0-35 range

  if (gapSize <= 4.0) {
    // Likely a GPA gap
    if (gapSize <= 0.2) {
      return {
        category: 'EASY',
        timelineMonths: 4, // 1 semester (4 months)
        timelineDescription: '1 semester (4 months)',
      }
    } else if (gapSize <= 0.5) {
      return {
        category: 'MODERATE',
        timelineMonths: 8, // 2 semesters (8 months)
        timelineDescription: '2-3 semesters (8-12 months)',
      }
    } else {
      return {
        category: 'LONG_TERM',
        timelineMonths: 16, // 4 semesters (16 months)
        timelineDescription: '4+ semesters (16+ months)',
      }
    }
  } else if (gapSize <= 40) {
    // Likely an ACT gap
    if (gapSize <= 3) {
      return {
        category: 'MODERATE',
        timelineMonths: 3, // 1 retake with 2-3 months prep
        timelineDescription: '2-3 months (1 retake with prep)',
      }
    } else {
      return {
        category: 'LONG_TERM',
        timelineMonths: 6, // Multiple retakes with extensive prep
        timelineDescription: '6+ months (extensive prep, multiple retakes)',
      }
    }
  } else {
    // Likely a SAT gap
    if (gapSize <= 100) {
      return {
        category: 'MODERATE',
        timelineMonths: 3, // 1 retake with 2-3 months prep
        timelineDescription: '2-3 months (1 retake with prep)',
      }
    } else {
      return {
        category: 'LONG_TERM',
        timelineMonths: 6, // Multiple retakes with extensive prep
        timelineDescription: '6+ months (extensive prep, multiple retakes)',
      }
    }
  }
}

/**
 * Assess experience gap achievability
 *
 * Heuristics:
 * - Volunteer hours: ≤50 = EASY (1-3 months at 4 hrs/week), 50-100 = MODERATE (3-6 months), >100 = LONG_TERM
 * - Leadership: Always MODERATE (requires election/appointment, typically 3-6 months)
 * - Extracurriculars: Joining = EASY (immediate), sustained participation = MODERATE
 */
function assessExperienceGap(gapSize: number, _profile: Profile): AchievabilityAssessment {
  // Check if this is a volunteer hours gap (typically 0-500 range)
  // or leadership gap (typically 0-5 range)

  if (gapSize <= 10) {
    // Likely a leadership gap (counting number of positions)
    return {
      category: 'MODERATE',
      timelineMonths: 6, // Election/appointment cycles are typically semester or annual
      timelineDescription: '3-6 months (requires election/appointment cycle)',
    }
  }

  // Volunteer hours gap
  if (gapSize <= 50) {
    // 50 hours at 4 hours/week = ~12 weeks (3 months)
    return {
      category: 'EASY',
      timelineMonths: 3,
      timelineDescription: '1-3 months (4 hours/week commitment)',
    }
  } else if (gapSize <= 100) {
    // 100 hours at 4 hours/week = ~25 weeks (6 months)
    return {
      category: 'MODERATE',
      timelineMonths: 6,
      timelineDescription: '3-6 months (4 hours/week commitment)',
    }
  } else {
    // >100 hours requires sustained long-term commitment
    const weeksNeeded = Math.ceil(gapSize / 4) // 4 hours/week
    const monthsNeeded = Math.ceil(weeksNeeded / 4)
    return {
      category: 'LONG_TERM',
      timelineMonths: Math.min(monthsNeeded, 12),
      timelineDescription: `${monthsNeeded} months (4 hours/week commitment)`,
    }
  }
}

/**
 * Get achievability label for display
 */
export function getAchievabilityLabel(category: AchievabilityCategory): string {
  switch (category) {
    case 'EASY':
      return 'Easy to achieve (1-3 months)'
    case 'MODERATE':
      return 'Moderate difficulty (3-6 months)'
    case 'LONG_TERM':
      return 'Long-term goal (6-12+ months)'
  }
}

/**
 * Get achievability color for UI
 */
export function getAchievabilityColor(
  category: AchievabilityCategory
): 'green' | 'yellow' | 'orange' {
  switch (category) {
    case 'EASY':
      return 'green'
    case 'MODERATE':
      return 'yellow'
    case 'LONG_TERM':
      return 'orange'
  }
}

/**
 * Get achievability priority (for sorting)
 * Lower number = higher priority (tackle easy wins first)
 */
export function getAchievabilityPriority(category: AchievabilityCategory): number {
  switch (category) {
    case 'EASY':
      return 1
    case 'MODERATE':
      return 2
    case 'LONG_TERM':
      return 3
  }
}
