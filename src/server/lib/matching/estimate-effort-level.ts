/**
 * Application Effort Estimation Module
 *
 * Analyzes scholarship requirements to estimate application effort level.
 * Used for strategic value ROI calculation (Story 2.6).
 *
 * Effort Thresholds:
 * - LOW: 0-1 essays, 0-2 docs, 0 recs (2-3 hours total)
 * - MEDIUM: 2 essays OR 3-4 docs OR 1 rec (4-6 hours total)
 * - HIGH: 3+ essays OR 5+ docs OR 2+ recs (8+ hours total)
 *
 * @module server/lib/matching/estimate-effort-level
 */

import type { Scholarship } from '@prisma/client'

/**
 * Effort level type matching Prisma enum
 */
export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Breakdown of application requirements
 */
export interface EffortBreakdown {
  /** Number of essays required */
  essays: number
  /** Number of documents required */
  documents: number
  /** Number of recommendation letters required */
  recommendations: number
}

/**
 * Result of effort estimation
 */
export interface EffortEstimation {
  /** Effort level classification */
  level: EffortLevel
  /** Detailed breakdown of requirements */
  breakdown: EffortBreakdown
  /** Effort multiplier for ROI calculation */
  multiplier: number
}

/**
 * Effort multipliers for ROI calculation
 * - LOW: 1.0 (no penalty)
 * - MEDIUM: 0.7 (30% penalty)
 * - HIGH: 0.4 (60% penalty)
 */
export const EFFORT_MULTIPLIERS: Record<EffortLevel, number> = {
  LOW: 1.0,
  MEDIUM: 0.7,
  HIGH: 0.4,
}

/**
 * Extract essay count from scholarship essayPrompts JSON field
 *
 * @param essayPrompts - JSON array of essay prompts or null
 * @returns Number of essays required
 */
function extractEssayCount(essayPrompts: unknown): number {
  if (!essayPrompts) return 0

  // essayPrompts is Json type from Prisma - could be array or object
  if (Array.isArray(essayPrompts)) {
    return essayPrompts.length
  }

  // If it's an object with prompts array
  if (typeof essayPrompts === 'object' && essayPrompts !== null) {
    const obj = essayPrompts as Record<string, unknown>
    if (Array.isArray(obj.prompts)) {
      return obj.prompts.length
    }
  }

  return 0
}

/**
 * Estimate application effort level for a scholarship
 *
 * Algorithm:
 * 1. Count required essays from essayPrompts JSON
 * 2. Count required documents from requiredDocuments array
 * 3. Extract recommendation letter count
 * 4. Apply thresholds to classify effort level
 *
 * @param scholarship - Scholarship entity with requirements
 * @returns Effort estimation with level, breakdown, and multiplier
 */
export function estimateEffortLevel(
  scholarship: Pick<Scholarship, 'essayPrompts' | 'requiredDocuments' | 'recommendationCount'>
): EffortEstimation {
  // Extract counts from scholarship requirements
  const essayCount = extractEssayCount(scholarship.essayPrompts)
  const docCount = scholarship.requiredDocuments?.length ?? 0
  const recCount = scholarship.recommendationCount ?? 0

  const breakdown: EffortBreakdown = {
    essays: essayCount,
    documents: docCount,
    recommendations: recCount,
  }

  // Apply thresholds to determine effort level
  let level: EffortLevel

  // HIGH: 3+ essays OR 5+ docs OR 2+ recs
  if (essayCount >= 3 || docCount >= 5 || recCount >= 2) {
    level = 'HIGH'
  }
  // MEDIUM: 2 essays OR 3-4 docs OR 1 rec
  else if (essayCount >= 2 || (docCount >= 3 && docCount <= 4) || recCount >= 1) {
    level = 'MEDIUM'
  }
  // LOW: 0-1 essays, 0-2 docs, 0 recs
  else {
    level = 'LOW'
  }

  return {
    level,
    breakdown,
    multiplier: EFFORT_MULTIPLIERS[level],
  }
}

/**
 * Estimate time investment in hours based on effort level
 *
 * @param level - Effort level classification
 * @returns Estimated time range in hours
 */
export function estimateTimeInvestment(level: EffortLevel): { min: number; max: number } {
  switch (level) {
    case 'LOW':
      return { min: 2, max: 3 }
    case 'MEDIUM':
      return { min: 4, max: 6 }
    case 'HIGH':
      return { min: 8, max: 12 }
  }
}
