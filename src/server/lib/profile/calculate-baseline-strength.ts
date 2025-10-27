/**
 * Profile Strength Baseline Calculator
 *
 * Calculates platform-wide average profile strength for use in success probability
 * adjustment. This baseline represents the "average applicant" strength.
 *
 * Story 2.5: Success Probability Prediction (AC#5)
 *
 * @module server/lib/profile/calculate-baseline-strength
 */

import { prisma } from '@/server/db'

/**
 * Baseline strength result
 */
export interface BaselineStrength {
  /** Average profile strength across all students */
  averageStrength: number
  /** Total number of students in calculation */
  sampleSize: number
  /** Median profile strength */
  medianStrength: number
  /** Standard deviation of profile strengths */
  standardDeviation: number
  /** Timestamp when calculated */
  calculatedAt: Date
}

/**
 * Calculate platform-wide baseline profile strength
 *
 * Aggregates all student profile strength scores to compute average,
 * which is used as the baseline (50) for success probability adjustments.
 *
 * This should be run daily via background job (Inngest) and cached in Redis.
 *
 * @returns Baseline strength statistics
 *
 * @example
 * ```typescript
 * const baseline = await calculateBaselineStrength()
 * // { averageStrength: 52.3, sampleSize: 1500, ... }
 *
 * // Use in success probability calculation:
 * const adjustment = (studentStrength - baseline.averageStrength) / 100
 * ```
 */
export async function calculateBaselineStrength(): Promise<BaselineStrength> {
  // Fetch all profile strength scores
  // Only include profiles with non-zero strength (completed profiles)
  const profiles = await prisma.profile.findMany({
    where: {
      strengthScore: {
        gt: 0,
      },
    },
    select: {
      strengthScore: true,
    },
  })

  if (profiles.length === 0) {
    // No profiles yet - return default baseline
    return {
      averageStrength: 50,
      sampleSize: 0,
      medianStrength: 50,
      standardDeviation: 0,
      calculatedAt: new Date(),
    }
  }

  // Calculate average strength
  const strengths = profiles.map((p) => p.strengthScore)
  const totalStrength = strengths.reduce((sum, s) => sum + s, 0)
  const averageStrength = totalStrength / strengths.length

  // Calculate median strength
  const sortedStrengths = [...strengths].sort((a, b) => a - b)
  const midpoint = Math.floor(sortedStrengths.length / 2)
  const medianStrength =
    sortedStrengths.length % 2 === 0
      ? (sortedStrengths[midpoint - 1]! + sortedStrengths[midpoint]!) / 2
      : sortedStrengths[midpoint]!

  // Calculate standard deviation
  const variance =
    strengths.reduce((sum, s) => sum + Math.pow(s - averageStrength, 2), 0) / strengths.length
  const standardDeviation = Math.sqrt(variance)

  return {
    averageStrength: Math.round(averageStrength * 10) / 10, // Round to 1 decimal
    sampleSize: strengths.length,
    medianStrength: Math.round(medianStrength * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    calculatedAt: new Date(),
  }
}

/**
 * Get profile strength adjustment for success probability
 *
 * Compares student's strength to baseline average:
 * - Above baseline → positive adjustment (stronger than average)
 * - Below baseline → negative adjustment (weaker than average)
 *
 * Note: Currently uses hardcoded baseline of 50. In production, this would
 * fetch from Redis cache populated by daily background job.
 *
 * @param studentStrength - Student's profile strength score
 * @param baseline - Platform baseline (default: 50, fetch from cache in production)
 * @returns Adjustment value (-0.5 to +0.5)
 */
export function getProfileStrengthAdjustment(
  studentStrength: number,
  baseline: number = 50
): number {
  // Calculate relative strength vs baseline
  // Range: -50 to +50 (if baseline is 50)
  const relativeStrength = studentStrength - baseline

  // Convert to adjustment factor (-0.5 to +0.5)
  const adjustment = relativeStrength / 100

  // Clamp to reasonable range
  return Math.max(-0.5, Math.min(0.5, adjustment))
}

/**
 * Cache baseline strength in Redis
 *
 * NOTE: This requires Redis/Upstash to be configured.
 * Placeholder implementation for future Inngest background job.
 *
 * @param baseline - Calculated baseline strength
 */
export async function cacheBaselineStrength(baseline: BaselineStrength): Promise<void> {
  // TODO: Implement Redis caching when Upstash is configured
  // Example:
  // await redis.set('profile:baseline:strength', JSON.stringify(baseline), {
  //   ex: 86400, // 24 hour TTL
  // })

  console.log('[Baseline Strength] Calculated:', baseline)
  console.log('[Baseline Strength] Redis caching not yet implemented')
}

/**
 * Get cached baseline strength from Redis
 *
 * NOTE: This requires Redis/Upstash to be configured.
 * Placeholder implementation - currently returns default baseline.
 *
 * @returns Cached baseline or default (50)
 */
export async function getCachedBaselineStrength(): Promise<number> {
  // TODO: Implement Redis retrieval when Upstash is configured
  // Example:
  // const cached = await redis.get('profile:baseline:strength')
  // if (cached) {
  //   const baseline = JSON.parse(cached) as BaselineStrength
  //   return baseline.averageStrength
  // }

  // Default baseline when no cache available
  return 50
}
