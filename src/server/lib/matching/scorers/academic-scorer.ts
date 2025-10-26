/**
 * Academic Match Scorer
 *
 * Calculates academic dimension score (0-100) based on:
 * - GPA vs minimum/maximum requirements
 * - SAT score vs minimum/maximum requirements
 * - ACT score vs minimum/maximum requirements
 * - Class rank percentile
 *
 * Partial match support: If student meets 80% of requirement, receives 80% of score
 *
 * @module server/lib/matching/scorers/academic-scorer
 */

import type { Profile } from '@prisma/client'
import type { AcademicCriteria } from '@/types/scholarship'

/**
 * Calculate academic match score between student profile and scholarship criteria
 *
 * @param profile - Student's academic profile data
 * @param criteria - Scholarship's academic eligibility criteria (optional)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const profile = { gpa: 3.7, satScore: 1350, actScore: null, ... }
 * const criteria = { minGPA: 3.5, minSAT: 1200 }
 * const score = calculateAcademicMatch(profile, criteria)
 * // Returns: 100 (exceeds both requirements)
 * ```
 */
export function calculateAcademicMatch(
  profile: Profile,
  criteria: AcademicCriteria | undefined
): number {
  // If no academic criteria specified, student automatically qualifies
  if (!criteria) {
    return 100
  }

  const scores: number[] = []
  let totalWeight = 0

  // GPA Scoring (weight: 40% of academic dimension)
  if (criteria.minGPA !== undefined || criteria.maxGPA !== undefined) {
    const gpaScore = calculateGPAScore(profile.gpa, criteria)
    scores.push(gpaScore * 0.4)
    totalWeight += 0.4
  }

  // SAT Scoring (weight: 30% of academic dimension)
  if (criteria.minSAT !== undefined || criteria.maxSAT !== undefined) {
    const satScore = calculateSATScore(profile.satScore, criteria)
    scores.push(satScore * 0.3)
    totalWeight += 0.3
  }

  // ACT Scoring (weight: 30% of academic dimension)
  if (criteria.minACT !== undefined || criteria.maxACT !== undefined) {
    const actScore = calculateACTScore(profile.actScore, criteria)
    scores.push(actScore * 0.3)
    totalWeight += 0.3
  }

  // Class Rank Scoring (weight: if present, redistributes from test scores)
  if (criteria.classRankPercentile !== undefined) {
    const rankScore = calculateClassRankScore(
      profile.classRank,
      profile.classSize,
      criteria.classRankPercentile
    )

    // If class rank specified, it replaces some test score weight
    if (totalWeight > 0) {
      // Redistribute: 40% GPA, 30% rank, 30% best test score
      const bestTestScore = Math.max(
        criteria.minSAT !== undefined || criteria.maxSAT !== undefined
          ? calculateSATScore(profile.satScore, criteria)
          : 0,
        criteria.minACT !== undefined || criteria.maxACT !== undefined
          ? calculateACTScore(profile.actScore, criteria)
          : 0
      )

      return profile.gpa !== null
        ? calculateGPAScore(profile.gpa, criteria) * 0.4 +
            rankScore * 0.3 +
            bestTestScore * 0.3
        : rankScore * 0.5 + bestTestScore * 0.5
    } else {
      // Only rank specified
      return rankScore
    }
  }

  // If no criteria matched, return 100 (no requirements)
  if (totalWeight === 0) {
    return 100
  }

  // Calculate weighted average (scores are already 0-100, weights are fractions)
  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  return Math.round(totalScore / totalWeight)
}

/**
 * Calculate GPA match score with partial match support
 */
function calculateGPAScore(
  studentGPA: number | null,
  criteria: AcademicCriteria
): number {
  if (studentGPA === null) {
    return 0 // Missing GPA = no match
  }

  const { minGPA, maxGPA } = criteria

  // Check minimum GPA requirement
  if (minGPA !== undefined) {
    if (studentGPA >= minGPA) {
      // Exceeds or meets minimum
      return 100
    } else {
      // Partial match: proportional score based on how close
      // Example: 3.3 GPA with 3.5 min = (3.3 / 3.5) * 100 = 94.3
      const percentOfRequirement = (studentGPA / minGPA) * 100
      return Math.round(Math.max(0, percentOfRequirement))
    }
  }

  // Check maximum GPA requirement (rare, for need-based scholarships)
  if (maxGPA !== undefined) {
    if (studentGPA <= maxGPA) {
      return 100
    } else {
      // Above maximum = reduced score
      const overage = studentGPA - maxGPA
      return Math.round(Math.max(0, 100 - overage * 20)) // Penalize 20 points per 0.1 over
    }
  }

  return 100
}

/**
 * Calculate SAT match score with partial match support
 */
function calculateSATScore(
  studentSAT: number | null,
  criteria: AcademicCriteria
): number {
  if (studentSAT === null) {
    return 0 // Missing SAT = no match
  }

  const { minSAT, maxSAT } = criteria

  // Check minimum SAT requirement
  if (minSAT !== undefined) {
    if (studentSAT >= minSAT) {
      return 100
    } else {
      // Partial match: proportional score
      // Example: 1200 SAT with 1300 min = (1200 / 1300) * 100 = 92.3
      const percentOfRequirement = (studentSAT / minSAT) * 100
      return Math.round(Math.max(0, percentOfRequirement))
    }
  }

  // Check maximum SAT requirement
  if (maxSAT !== undefined) {
    if (studentSAT <= maxSAT) {
      return 100
    } else {
      // Above maximum = reduced score
      const overage = studentSAT - maxSAT
      return Math.round(Math.max(0, 100 - overage / 10)) // Penalize 10 points per 100 over
    }
  }

  return 100
}

/**
 * Calculate ACT match score with partial match support
 */
function calculateACTScore(
  studentACT: number | null,
  criteria: AcademicCriteria
): number {
  if (studentACT === null) {
    return 0 // Missing ACT = no match
  }

  const { minACT, maxACT } = criteria

  // Check minimum ACT requirement
  if (minACT !== undefined) {
    if (studentACT >= minACT) {
      return 100
    } else {
      // Partial match: proportional score
      // Example: 26 ACT with 28 min = (26 / 28) * 100 = 92.9
      const percentOfRequirement = (studentACT / minACT) * 100
      return Math.round(Math.max(0, percentOfRequirement))
    }
  }

  // Check maximum ACT requirement
  if (maxACT !== undefined) {
    if (studentACT <= maxACT) {
      return 100
    } else {
      // Above maximum = reduced score
      const overage = studentACT - maxACT
      return Math.round(Math.max(0, 100 - overage * 10)) // Penalize 10 points per point over
    }
  }

  return 100
}

/**
 * Calculate class rank percentile score
 *
 * @example
 * Student ranked 5th out of 100 = Top 5%
 * Scholarship requires Top 10% = 100 score
 * Scholarship requires Top 3% = partial score (5/3 * 100 = but capped)
 */
function calculateClassRankScore(
  classRank: number | null,
  classSize: number | null,
  requiredPercentile: number
): number {
  if (classRank === null || classSize === null || classSize === 0) {
    return 0 // Missing data = no match
  }

  // Calculate student's actual percentile
  const studentPercentile = (classRank / classSize) * 100

  if (studentPercentile <= requiredPercentile) {
    // Student meets or exceeds requirement (lower percentile is better)
    return 100
  } else {
    // Partial match: how close to requirement
    // Example: Top 15% when Top 10% required = (10 / 15) * 100 = 66.7
    const percentOfRequirement = (requiredPercentile / studentPercentile) * 100
    return Math.round(Math.max(0, percentOfRequirement))
  }
}
