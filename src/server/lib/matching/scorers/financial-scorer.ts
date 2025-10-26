/**
 * Financial Match Scorer
 *
 * Calculates financial dimension score (0-100) based on:
 * - Financial need level match
 * - Expected Family Contribution (EFC) requirements
 * - Pell Grant eligibility
 *
 * @module server/lib/matching/scorers/financial-scorer
 */

import type { Profile, FinancialNeed } from '@prisma/client'
import type { FinancialCriteria } from '@/types/scholarship'

/**
 * Calculate financial match score between student profile and scholarship criteria
 *
 * @param profile - Student's financial profile data
 * @param criteria - Scholarship's financial eligibility criteria (optional)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const profile = { financialNeed: 'HIGH', pellGrantEligible: true, efcRange: '0-5000' }
 * const criteria = { requiresFinancialNeed: true, pellGrantRequired: true }
 * const score = calculateFinancialMatch(profile, criteria)
 * // Returns: 100 (matches financial need and Pell Grant requirements)
 * ```
 */
export function calculateFinancialMatch(
  profile: Profile,
  criteria: FinancialCriteria | undefined
): number {
  // If no financial criteria specified, student automatically qualifies
  if (!criteria) {
    return 100
  }

  const scores: number[] = []
  const weights: number[] = []

  // Financial Need Requirement (weight: 50% of dimension)
  if (criteria.requiresFinancialNeed !== undefined) {
    const needScore = calculateFinancialNeedScore(
      profile.financialNeed,
      criteria.requiresFinancialNeed,
      criteria.financialNeedLevel
    )
    scores.push(needScore)
    weights.push(0.5)
  }

  // Pell Grant Eligibility (weight: 30% of dimension)
  if (criteria.pellGrantRequired !== undefined) {
    const pellScore = profile.pellGrantEligible === criteria.pellGrantRequired ? 100 : 0
    scores.push(pellScore)
    weights.push(0.3)
  }

  // EFC Requirements (weight: 20% of dimension)
  if (criteria.maxEFC !== undefined) {
    const efcScore = calculateEFCScore(profile.efcRange, criteria.maxEFC)
    scores.push(efcScore)
    weights.push(0.2)
  }

  // If no criteria specified, return 100
  if (scores.length === 0) {
    return 100
  }

  // Calculate weighted average
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const weightedScore = scores.reduce(
    (sum, score, i) => sum + score * weights[i]!,
    0
  )

  return Math.round((weightedScore / totalWeight))
}

/**
 * Calculate financial need score
 *
 * Maps financial need levels to numeric scores for comparison
 */
function calculateFinancialNeedScore(
  studentNeed: FinancialNeed | null,
  requiresNeed: boolean,
  requiredLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
): number {
  // If scholarship requires financial need
  if (requiresNeed) {
    if (!studentNeed) {
      return 0 // No financial need data = no match
    }

    // If specific level required, check match
    if (requiredLevel) {
      const needLevels: Record<FinancialNeed, number> = {
        LOW: 1,
        MODERATE: 2,
        HIGH: 3,
        VERY_HIGH: 4,
      }

      const studentLevel = needLevels[studentNeed]
      const requiredLevelNum = needLevels[requiredLevel]

      if (studentLevel >= requiredLevelNum) {
        return 100 // Student has same or higher need level
      } else {
        // Partial match: student has some need but not enough
        const percentOfRequirement = (studentLevel / requiredLevelNum) * 100
        return Math.round(Math.max(0, percentOfRequirement))
      }
    }

    // Any level of need is acceptable
    return 100
  }

  // Scholarship doesn't require financial need
  return 100
}

/**
 * Calculate EFC (Expected Family Contribution) score
 *
 * @param efcRange - Student's EFC range as string (e.g., "0-5000", "5001-10000")
 * @param maxEFC - Maximum EFC allowed by scholarship
 */
function calculateEFCScore(efcRange: string | null, maxEFC: number): number {
  if (!efcRange) {
    return 0 // No EFC data = no match
  }

  // Parse EFC range to get upper bound
  // Format: "0-5000", "5001-10000", "10001-15000", etc.
  const efcParts = efcRange.split('-')
  const studentMaxEFC = efcParts.length > 1 ? parseInt(efcParts[1] || '0', 10) : 0

  if (studentMaxEFC <= maxEFC) {
    return 100 // Student's max EFC is within scholarship's limit
  } else {
    // Partial match: how close to limit
    // Example: max EFC is 5000, student is 6000 = (5000 / 6000) * 100 = 83
    const percentOfRequirement = (maxEFC / studentMaxEFC) * 100
    return Math.round(Math.max(0, percentOfRequirement))
  }
}
