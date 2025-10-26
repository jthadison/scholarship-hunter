/**
 * Competition Factor Calculator
 *
 * Calculates a competition factor (0.0-1.0) based on scholarship competition metadata:
 * - Historical acceptance rate (if available)
 * - Applicant pool size (estimated acceptance rate)
 * - Default fallback (30% acceptance rate)
 *
 * Used by success probability algorithm to adjust base probability based on competition level.
 *
 * @module server/lib/matching/calculate-competition-factor
 */

import type { Scholarship } from '@prisma/client'

/**
 * Calculate competition factor for a scholarship
 *
 * Priority order:
 * 1. Use historical acceptanceRate if available (most accurate)
 * 2. Estimate from applicantPoolSize if available
 * 3. Default to 30% acceptance rate (conservative estimate)
 *
 * @param scholarship - Scholarship with competition metadata
 * @returns Competition factor (0.0-1.0) representing acceptance probability
 *
 * @example
 * ```typescript
 * // Scholarship with historical acceptance rate
 * const scholarship1 = { acceptanceRate: 0.25, applicantPoolSize: null }
 * calculateCompetitionFactor(scholarship1) // 0.25
 *
 * // Scholarship with pool size only
 * const scholarship2 = { acceptanceRate: null, applicantPoolSize: 500 }
 * calculateCompetitionFactor(scholarship2) // ~0.2 (100/500)
 *
 * // Scholarship with no competition data
 * const scholarship3 = { acceptanceRate: null, applicantPoolSize: null }
 * calculateCompetitionFactor(scholarship3) // 0.3 (default)
 * ```
 */
export function calculateCompetitionFactor(scholarship: Scholarship): number {
  // Priority 1: Use historical acceptance rate if available
  if (scholarship.acceptanceRate !== null && scholarship.acceptanceRate !== undefined) {
    return clampCompetitionFactor(scholarship.acceptanceRate)
  }

  // Priority 2: Estimate from applicant pool size
  if (scholarship.applicantPoolSize !== null && scholarship.applicantPoolSize !== undefined) {
    return estimateAcceptanceRateFromPoolSize(
      scholarship.applicantPoolSize,
      scholarship.numberOfAwards
    )
  }

  // Priority 3: Default fallback (30% acceptance rate)
  return 0.3
}

/**
 * Estimate acceptance rate from applicant pool size
 *
 * Formula: min(0.8, numberOfAwards * 100 / applicantPoolSize)
 * - Scale by number of awards (multiple winners increase acceptance rate)
 * - Cap at 80% to avoid overestimating for very small pools
 * - Minimum 5% to avoid zero probability
 *
 * @param poolSize - Number of expected applicants
 * @param numberOfAwards - Number of scholarship awards available
 * @returns Estimated acceptance rate (0.05-0.8)
 */
function estimateAcceptanceRateFromPoolSize(
  poolSize: number,
  numberOfAwards: number
): number {
  // Handle edge cases
  if (poolSize <= 0) {
    return 0.3 // Default if invalid pool size
  }

  if (numberOfAwards <= 0) {
    return 0.05 // Minimum if no awards (shouldn't happen)
  }

  // Calculate acceptance rate: (awards / applicants)
  // Multiply by 100 to convert from ratio to percentage-like scale
  const baseRate = Math.min(0.8, (numberOfAwards * 100) / poolSize)

  // Ensure minimum 5% acceptance rate
  return Math.max(0.05, baseRate)
}

/**
 * Clamp competition factor to valid range
 *
 * Ensures acceptance rates are between 5% and 95% to avoid:
 * - Zero probability (discouraging to students)
 * - False certainty (no scholarship is guaranteed)
 *
 * @param factor - Raw competition factor
 * @returns Clamped factor (0.05-0.95)
 */
function clampCompetitionFactor(factor: number): number {
  return Math.max(0.05, Math.min(0.95, factor))
}
