/**
 * Success Tier Classification
 *
 * Maps success probability (0-100%) to tiered classification system:
 * - Strong Match: 70-100% (high confidence, apply immediately)
 * - Competitive Match: 40-69% (solid opportunity, worth effort)
 * - Reach: 10-39% (long shot, but possible)
 * - Long-Shot: <10% (very competitive, consider if high value)
 *
 * @module server/lib/matching/classify-success-tier
 */

/**
 * Success tier enum matching Prisma schema
 * (Will be added to schema in Task 4)
 */
export type SuccessTier = 'STRONG_MATCH' | 'COMPETITIVE_MATCH' | 'REACH' | 'LONG_SHOT'

/**
 * Tier classification result with display metadata
 */
export interface SuccessTierResult {
  tier: SuccessTier
  probability: number
  label: string
  description: string
  color: 'green' | 'blue' | 'orange' | 'red'
}

/**
 * Tier threshold boundaries
 *
 * From tech-spec-epic-2.md and story acceptance criteria:
 * - Strong Match: 70-100%
 * - Competitive Match: 40-69%
 * - Reach: 10-39%
 * - Long-Shot: <10%
 */
const TIER_THRESHOLDS = {
  STRONG_MATCH: 70,
  COMPETITIVE_MATCH: 40,
  REACH: 10,
} as const

/**
 * Tier display metadata
 */
const TIER_METADATA: Record<
  SuccessTier,
  {
    label: string
    description: string
    color: 'green' | 'blue' | 'orange' | 'red'
  }
> = {
  STRONG_MATCH: {
    label: 'Strong Match',
    description: 'Apply immediately, high confidence',
    color: 'green',
  },
  COMPETITIVE_MATCH: {
    label: 'Competitive Match',
    description: 'Solid opportunity, worth effort',
    color: 'blue',
  },
  REACH: {
    label: 'Reach',
    description: 'Long shot, but possible',
    color: 'orange',
  },
  LONG_SHOT: {
    label: 'Long-Shot',
    description: 'Very competitive, consider if high value',
    color: 'red',
  },
}

/**
 * Classify success probability into tier
 *
 * @param probability - Success probability percentage (0-100)
 * @returns Structured tier result with display metadata
 *
 * @example
 * ```typescript
 * classifySuccessTier(72)
 * // {
 * //   tier: 'STRONG_MATCH',
 * //   probability: 72,
 * //   label: 'Strong Match',
 * //   description: 'Apply immediately, high confidence',
 * //   color: 'green'
 * // }
 *
 * classifySuccessTier(55)
 * // { tier: 'COMPETITIVE_MATCH', probability: 55, ... }
 *
 * classifySuccessTier(25)
 * // { tier: 'REACH', probability: 25, ... }
 *
 * classifySuccessTier(8)
 * // { tier: 'LONG_SHOT', probability: 8, ... }
 * ```
 */
export function classifySuccessTier(probability: number): SuccessTierResult {
  // Determine tier based on threshold boundaries
  let tier: SuccessTier

  if (probability >= TIER_THRESHOLDS.STRONG_MATCH) {
    tier = 'STRONG_MATCH'
  } else if (probability >= TIER_THRESHOLDS.COMPETITIVE_MATCH) {
    tier = 'COMPETITIVE_MATCH'
  } else if (probability >= TIER_THRESHOLDS.REACH) {
    tier = 'REACH'
  } else {
    tier = 'LONG_SHOT'
  }

  // Get display metadata for tier
  const metadata = TIER_METADATA[tier]

  return {
    tier,
    probability,
    label: metadata.label,
    description: metadata.description,
    color: metadata.color,
  }
}

/**
 * Format tier result as display string
 *
 * @param tierResult - Result from classifySuccessTier()
 * @returns Formatted string: "{probability}% success probability - {tier}"
 *
 * @example
 * ```typescript
 * const result = classifySuccessTier(72)
 * formatTierDisplay(result) // "72% success probability - Strong Match"
 * ```
 */
export function formatTierDisplay(tierResult: SuccessTierResult): string {
  return `${tierResult.probability}% success probability - ${tierResult.label}`
}

/**
 * Get tier color for UI styling
 *
 * @param tier - Success tier
 * @returns Color string for badge/indicator styling
 */
export function getTierColor(tier: SuccessTier): 'green' | 'blue' | 'orange' | 'red' {
  return TIER_METADATA[tier].color
}
