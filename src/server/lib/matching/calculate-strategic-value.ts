/**
 * Strategic Value ROI Calculation Module
 *
 * Calculates return on investment (ROI) for scholarship applications.
 * Balances match quality, award amount, success probability, and application effort.
 *
 * ROI Formula: (awardAmount × successProbability × effortMultiplier) / 1000
 * Normalized to 0-10 scale for easier comparison
 *
 * @module server/lib/matching/calculate-strategic-value
 */

import type { EffortLevel } from './estimate-effort-level'
import { EFFORT_MULTIPLIERS } from './estimate-effort-level'

/**
 * Strategic value calculation result
 */
export interface StrategicValueResult {
  /** Strategic value score (0-10 scale) */
  strategicValue: number
  /** Expected value in dollars (award × probability) */
  expectedValue: number
  /** Effort-adjusted value (expected value × effort multiplier) */
  effortAdjustedValue: number
}

/**
 * Calculate strategic value ROI for a scholarship
 *
 * Algorithm:
 * 1. Calculate expected value: awardAmount × successProbability
 * 2. Apply effort multiplier: expectedValue × effortMultiplier
 * 3. Normalize to 0-10 scale by dividing by 1000
 *
 * @param params - Calculation parameters
 * @param params.matchScore - Overall match score (0-100)
 * @param params.successProbability - Success probability (0-100 percentage)
 * @param params.awardAmount - Scholarship award amount in dollars
 * @param params.effortLevel - Application effort level
 * @returns Strategic value result with normalized score
 */
export function calculateStrategicValue(params: {
  matchScore: number
  successProbability: number
  awardAmount: number
  effortLevel: EffortLevel
}): StrategicValueResult {
  const { successProbability, awardAmount, effortLevel } = params

  // Handle edge cases
  if (awardAmount <= 0 || successProbability <= 0) {
    return {
      strategicValue: 0,
      expectedValue: 0,
      effortAdjustedValue: 0,
    }
  }

  // Get effort multiplier
  const effortMultiplier = EFFORT_MULTIPLIERS[effortLevel]

  // Convert success probability from percentage (0-100) to decimal (0-1)
  const probabilityDecimal = successProbability / 100

  // Calculate expected value (award × probability)
  const expectedValue = awardAmount * probabilityDecimal

  // Apply effort adjustment
  const effortAdjustedValue = expectedValue * effortMultiplier

  // Normalize to 0-10 scale
  // Divide by 1000 to convert dollar amounts to reasonable scale
  const strategicValue = effortAdjustedValue / 1000

  // Cap at 10 for extreme cases
  const cappedStrategicValue = Math.min(strategicValue, 10)

  return {
    strategicValue: cappedStrategicValue,
    expectedValue,
    effortAdjustedValue,
  }
}

/**
 * Calculate strategic value with match score influence (alternative formula)
 *
 * This version includes match score as a factor in the calculation,
 * giving slight boost to scholarships with better fit.
 *
 * @param params - Calculation parameters
 * @returns Strategic value result
 */
export function calculateStrategicValueWithMatchBoost(params: {
  matchScore: number
  successProbability: number
  awardAmount: number
  effortLevel: EffortLevel
}): StrategicValueResult {
  const baseResult = calculateStrategicValue(params)

  // Apply 10% boost for perfect matches (scale 0-1.1)
  const matchBoost = 1 + (params.matchScore / 100) * 0.1

  return {
    strategicValue: Math.min(baseResult.strategicValue * matchBoost, 10),
    expectedValue: baseResult.expectedValue,
    effortAdjustedValue: baseResult.effortAdjustedValue * matchBoost,
  }
}
