/**
 * Match Scoring Type Definitions
 *
 * Defines types for the match scoring algorithm that calculates 0-100 scores
 * across 6 dimensions for scholarship matching.
 *
 * @module server/lib/matching/types
 */

/**
 * Success tier type (Story 2.5)
 */
export type SuccessTier = 'STRONG_MATCH' | 'COMPETITIVE_MATCH' | 'REACH' | 'LONG_SHOT'

/**
 * Effort level type (Story 2.6)
 */
export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Strategic value tier type (Story 2.6)
 */
export type StrategicValueTier = 'BEST_BET' | 'HIGH_VALUE' | 'MEDIUM_VALUE' | 'LOW_VALUE'

/**
 * Effort breakdown (Story 2.6)
 */
export interface EffortBreakdown {
  essays: number
  documents: number
  recommendations: number
}

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

  /** Story 2.5: Success probability percentage (0-100) */
  successProbability: number

  /** Story 2.5: Success tier classification */
  successTier: SuccessTier

  /** Story 2.5: Competition factor (0.0-1.0) */
  competitionFactor: number

  /** Story 2.6: Strategic value ROI score (0-10) */
  strategicValue: number

  /** Story 2.6: Application effort level */
  applicationEffort: EffortLevel

  /** Story 2.6: Detailed effort breakdown */
  effortBreakdown: EffortBreakdown

  /** Story 2.6: Strategic value tier classification */
  strategicValueTier: StrategicValueTier

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
