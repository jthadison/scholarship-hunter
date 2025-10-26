/**
 * Match Scoring Type Definitions
 *
 * Defines types for the match scoring algorithm that calculates 0-100 scores
 * across 6 dimensions for scholarship matching.
 *
 * @module server/lib/matching/types
 */

/**
 * Match score result containing overall score and dimensional breakdowns
 *
 * All scores range from 0-100:
 * - 0 = No match/criteria not met
 * - 100 = Perfect match/criteria fully met
 * - 1-99 = Partial match with proportional scoring
 */
export interface MatchScore {
  /** Overall weighted match score (0-100) */
  overallMatchScore: number

  /** Academic dimension score (0-100) - GPA, test scores, class rank */
  academicScore: number

  /** Demographic dimension score (0-100) - gender, ethnicity, location */
  demographicScore: number

  /** Major/field dimension score (0-100) - major alignment, field of study */
  majorFieldScore: number

  /** Experience dimension score (0-100) - extracurriculars, volunteer hours, leadership */
  experienceScore: number

  /** Financial dimension score (0-100) - financial need alignment */
  financialScore: number

  /** Special criteria score (0-100) - first-gen, military, disabilities */
  specialCriteriaScore: number

  /** Timestamp when match was calculated */
  calculatedAt: Date
}

/**
 * Weighted scoring configuration
 *
 * Defines how much each dimension contributes to the overall match score.
 * Weights must sum to 1.0 (100%).
 *
 * Default weights per tech-spec-epic-2.md:
 * - Academic: 30% (most important)
 * - Major: 20%
 * - Demographic: 15%
 * - Experience: 15%
 * - Financial: 10%
 * - Special: 10%
 */
export interface ScoringWeights {
  academic: number
  demographic: number
  majorField: number
  experience: number
  financial: number
  special: number
}

/**
 * Default scoring weights based on tech spec
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  academic: 0.30,
  demographic: 0.15,
  majorField: 0.20,
  experience: 0.15,
  financial: 0.10,
  special: 0.10,
}
