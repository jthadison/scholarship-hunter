/**
 * Historical Winner Comparison
 *
 * Compares student profile to past scholarship winners when historical data available.
 * Provides context like "Past winners had average GPA 3.8 (yours: 3.7)" for
 * transparent probability assessment.
 *
 * Story 2.5: Success Probability Prediction (AC#7)
 *
 * @module server/lib/matching/compare-to-historical-winners
 */

import type { Profile } from '@prisma/client'

/**
 * Historical winner profile data structure
 *
 * Stored in Scholarship.historicalWinnerProfiles JSON field
 */
export interface HistoricalWinnerProfile {
  /** Average GPA of past winners */
  averageGpa?: number
  /** Average SAT score of past winners */
  averageSat?: number
  /** Average ACT score of past winners */
  averageAct?: number
  /** Common majors among winners */
  commonMajors?: string[]
  /** Average profile strength score */
  averageStrength?: number
  /** Number of historical winners in sample */
  sampleSize?: number
}

/**
 * Comparison result showing student vs historical winners
 */
export interface HistoricalComparison {
  /** Whether historical data is available */
  hasData: boolean
  /** GPA comparison */
  gpaComparison?: {
    studentGpa: number
    averageGpa: number
    difference: number
    isAbove: boolean
  }
  /** SAT comparison */
  satComparison?: {
    studentSat: number
    averageSat: number
    difference: number
    isAbove: boolean
  }
  /** ACT comparison */
  actComparison?: {
    studentAct: number
    averageAct: number
    difference: number
    isAbove: boolean
  }
  /** Profile strength comparison */
  strengthComparison?: {
    studentStrength: number
    averageStrength: number
    difference: number
    isAbove: boolean
  }
  /** Overall similarity score (0-100) */
  overallSimilarity?: number
  /** Textual summary for display */
  summary: string[]
}

/**
 * Compare student profile to historical winners
 *
 * @param profile - Student profile
 * @param historicalData - Historical winner profile data (from Scholarship.historicalWinnerProfiles)
 * @returns Comparison result with detailed breakdown
 *
 * @example
 * ```typescript
 * const historical = {
 *   averageGpa: 3.8,
 *   averageSat: 1450,
 *   averageStrength: 85,
 *   sampleSize: 50
 * }
 * const comparison = compareToHistoricalWinners(studentProfile, historical)
 * // {
 * //   hasData: true,
 * //   gpaComparison: { studentGpa: 3.7, averageGpa: 3.8, difference: -0.1, isAbove: false },
 * //   summary: ["Past winners had average GPA 3.8 (yours: 3.7)"]
 * // }
 * ```
 */
export function compareToHistoricalWinners(
  profile: Profile,
  historicalData: HistoricalWinnerProfile | null | undefined
): HistoricalComparison {
  // No historical data available
  if (!historicalData || !historicalData.sampleSize) {
    return {
      hasData: false,
      summary: ['Historical winner data unavailable for this scholarship'],
    }
  }

  const summary: string[] = []
  let totalDifference = 0
  let comparisonCount = 0

  // Build comparison result
  const comparison: HistoricalComparison = {
    hasData: true,
    summary: [],
  }

  // GPA comparison
  if (profile.gpa && historicalData.averageGpa) {
    const difference = profile.gpa - historicalData.averageGpa
    comparison.gpaComparison = {
      studentGpa: profile.gpa,
      averageGpa: historicalData.averageGpa,
      difference,
      isAbove: difference >= 0,
    }
    summary.push(
      `Past winners had average GPA ${historicalData.averageGpa.toFixed(1)} (yours: ${profile.gpa.toFixed(1)})`
    )
    totalDifference += Math.abs(difference) / 4.0 // Normalize by GPA scale
    comparisonCount++
  }

  // SAT comparison
  if (profile.satScore && historicalData.averageSat) {
    const difference = profile.satScore - historicalData.averageSat
    comparison.satComparison = {
      studentSat: profile.satScore,
      averageSat: historicalData.averageSat,
      difference,
      isAbove: difference >= 0,
    }
    summary.push(
      `Past winners had average SAT ${historicalData.averageSat} (yours: ${profile.satScore})`
    )
    totalDifference += Math.abs(difference) / 1600 // Normalize by SAT scale
    comparisonCount++
  }

  // ACT comparison
  if (profile.actScore && historicalData.averageAct) {
    const difference = profile.actScore - historicalData.averageAct
    comparison.actComparison = {
      studentAct: profile.actScore,
      averageAct: historicalData.averageAct,
      difference,
      isAbove: difference >= 0,
    }
    summary.push(
      `Past winners had average ACT ${historicalData.averageAct} (yours: ${profile.actScore})`
    )
    totalDifference += Math.abs(difference) / 36 // Normalize by ACT scale
    comparisonCount++
  }

  // Profile strength comparison
  if (historicalData.averageStrength) {
    const difference = profile.strengthScore - historicalData.averageStrength
    comparison.strengthComparison = {
      studentStrength: profile.strengthScore,
      averageStrength: historicalData.averageStrength,
      difference,
      isAbove: difference >= 0,
    }
    summary.push(
      `Past winners had average profile strength ${Math.round(historicalData.averageStrength)} (yours: ${Math.round(profile.strengthScore)})`
    )
    totalDifference += Math.abs(difference) / 100 // Normalize by strength scale
    comparisonCount++
  }

  // Calculate overall similarity (0-100)
  // Lower totalDifference = higher similarity
  if (comparisonCount > 0) {
    const averageDifference = totalDifference / comparisonCount
    comparison.overallSimilarity = Math.round((1 - averageDifference) * 100)
  }

  // Add sample size note
  if (historicalData.sampleSize) {
    summary.push(`Based on ${historicalData.sampleSize} past winners`)
  }

  comparison.summary = summary

  return comparison
}

/**
 * Adjust success probability based on historical winner similarity
 *
 * If student profile is similar to past winners, increase probability slightly.
 * If very different, decrease slightly.
 *
 * @param baseProbability - Calculated success probability before historical adjustment
 * @param historicalComparison - Comparison result from compareToHistoricalWinners()
 * @returns Adjusted probability (still clamped to 5-95%)
 */
export function adjustProbabilityForHistoricalData(
  baseProbability: number,
  historicalComparison: HistoricalComparison
): number {
  // No adjustment if no historical data
  if (!historicalComparison.hasData || !historicalComparison.overallSimilarity) {
    return baseProbability
  }

  // Calculate adjustment based on similarity
  // High similarity (90+) → +5% boost
  // Medium similarity (70-89) → +2% boost
  // Low similarity (50-69) → no change
  // Very low similarity (<50) → -2% penalty
  const similarity = historicalComparison.overallSimilarity

  let adjustment = 0
  if (similarity >= 90) {
    adjustment = 5
  } else if (similarity >= 70) {
    adjustment = 2
  } else if (similarity < 50) {
    adjustment = -2
  }

  // Apply adjustment and clamp
  const adjustedProbability = baseProbability + adjustment
  return Math.max(5, Math.min(95, adjustedProbability))
}
