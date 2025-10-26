/**
 * Success Probability Calculator
 *
 * Predicts student's likelihood of winning a scholarship (0-100%) using a 3-factor model:
 * 1. Base probability from match score
 * 2. Competition adjustment (acceptance rate or pool size)
 * 3. Profile strength adjustment (relative to average applicant)
 *
 * Implements probabilistic reasoning with clamping (5-95%) to avoid false certainty.
 *
 * @module server/lib/matching/calculate-success-probability
 */

import type { Scholarship, Profile } from '@prisma/client'
import { calculateCompetitionFactor } from './calculate-competition-factor'

/**
 * Calculate success probability for a student-scholarship pair
 *
 * Algorithm (from tech-spec-epic-2.md):
 * 1. Base probability = matchScore / 100 (e.g., 88 → 0.88)
 * 2. Apply competition factor = baseProbability × competitionFactor
 * 3. Apply profile strength adjustment = probability + ((profileStrength - 50) / 100)
 * 4. Clamp result between 0.05 and 0.95
 * 5. Convert to percentage (0-100%)
 *
 * @param matchScore - Overall match score (0-100) from Story 2.4
 * @param profile - Student profile with strengthScore from Story 1.7
 * @param scholarship - Scholarship with competition metadata
 * @returns Success probability as percentage (5-95%)
 *
 * @example
 * ```typescript
 * const probability = calculateSuccessProbability(
 *   88,              // 88% match score
 *   { strengthScore: 82 },  // Above-average profile
 *   { applicantPoolSize: 500, acceptanceRate: 0.2 }
 * )
 * // Result: 72 (72% success probability)
 * ```
 */
export function calculateSuccessProbability(
  matchScore: number,
  profile: Profile,
  scholarship: Scholarship
): number {
  // Step 1: Base probability from match score (0-100 → 0.0-1.0)
  let probability = matchScore / 100

  // Step 2: Adjust for competition level
  const competitionFactor = calculateCompetitionFactor(scholarship)
  probability *= competitionFactor

  // Step 3: Adjust for profile strength relative to baseline (50 = average)
  // Range: -0.5 (very weak profile) to +0.5 (very strong profile)
  const profileStrength = profile.strengthScore
  const strengthAdjustment = (profileStrength - 50) / 100
  probability += strengthAdjustment

  // Step 4: Clamp between 0.05 and 0.95 (avoid false certainty)
  const clampedProbability = Math.max(0.05, Math.min(0.95, probability))

  // Step 5: Convert to percentage (0-100%)
  return Math.round(clampedProbability * 100)
}

/**
 * Calculate success probability with detailed breakdown
 *
 * Returns structured object showing each factor's contribution for transparent explainability.
 *
 * @param matchScore - Overall match score (0-100)
 * @param profile - Student profile with strengthScore
 * @param scholarship - Scholarship with competition metadata
 * @returns Detailed breakdown of probability calculation
 *
 * @example
 * ```typescript
 * const breakdown = calculateSuccessProbabilityDetailed(88, profile, scholarship)
 * // {
 * //   finalProbability: 72,
 * //   baseProbability: 88,
 * //   afterCompetition: 65,
 * //   afterStrengthAdjustment: 72,
 * //   competitionFactor: 0.74,
 * //   strengthAdjustment: 7
 * // }
 * ```
 */
export function calculateSuccessProbabilityDetailed(
  matchScore: number,
  profile: Profile,
  scholarship: Scholarship
): {
  finalProbability: number
  baseProbability: number
  afterCompetition: number
  afterStrengthAdjustment: number
  competitionFactor: number
  strengthAdjustment: number
} {
  // Base probability from match score
  const baseProbability = matchScore

  // Competition adjustment
  const competitionFactor = calculateCompetitionFactor(scholarship)
  const afterCompetition = (matchScore / 100) * competitionFactor

  // Profile strength adjustment
  const profileStrength = profile.strengthScore
  const strengthAdjustment = (profileStrength - 50) / 100
  const afterStrengthAdjustment = afterCompetition + strengthAdjustment

  // Clamp and convert to percentage
  const clampedProbability = Math.max(0.05, Math.min(0.95, afterStrengthAdjustment))
  const finalProbability = Math.round(clampedProbability * 100)

  return {
    finalProbability,
    baseProbability,
    afterCompetition: Math.round(afterCompetition * 100),
    afterStrengthAdjustment: Math.round(afterStrengthAdjustment * 100),
    competitionFactor: Math.round(competitionFactor * 100) / 100,
    strengthAdjustment: Math.round(strengthAdjustment * 100),
  }
}
