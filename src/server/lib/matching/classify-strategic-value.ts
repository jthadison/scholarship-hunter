/**
 * Strategic Value Classification Module
 *
 * Classifies strategic value scores into actionable tiers.
 * Provides display strings and visual indicators for UI.
 *
 * Value Tiers:
 * - BEST_BET: ROI ≥ 5.0 (apply immediately)
 * - HIGH_VALUE: ROI 3.0-4.9 (strong candidates)
 * - MEDIUM_VALUE: ROI 1.5-2.9 (if time permits)
 * - LOW_VALUE: ROI < 1.5 (probably skip)
 *
 * @module server/lib/matching/classify-strategic-value
 */

/**
 * Strategic value tier type matching Prisma enum
 */
export type StrategicValueTier = 'BEST_BET' | 'HIGH_VALUE' | 'MEDIUM_VALUE' | 'LOW_VALUE'

/**
 * Tier classification result
 */
export interface StrategicValueClassification {
  /** Strategic value tier */
  tier: StrategicValueTier
  /** Original strategic value score */
  value: number
  /** Display label for UI */
  label: string
  /** Color for visual indicators */
  color: string
  /** Icon/emoji for badges */
  icon: string
  /** Recommendation text */
  recommendation: string
}

/**
 * Tier thresholds
 */
export const TIER_THRESHOLDS = {
  BEST_BET: 5.0,
  HIGH_VALUE: 3.0,
  MEDIUM_VALUE: 1.5,
} as const

/**
 * Tier configurations for UI display
 */
const TIER_CONFIG: Record<StrategicValueTier, Omit<StrategicValueClassification, 'tier' | 'value'>> = {
  BEST_BET: {
    label: 'Best Bet',
    color: 'gold',
    icon: '⭐',
    recommendation: 'Apply immediately - highest expected return per hour invested',
  },
  HIGH_VALUE: {
    label: 'High Value',
    color: 'green',
    icon: '✓',
    recommendation: 'Strong opportunity worth pursuing after best bets',
  },
  MEDIUM_VALUE: {
    label: 'Medium Value',
    color: 'blue',
    icon: '•',
    recommendation: 'Apply if time permits after higher priorities',
  },
  LOW_VALUE: {
    label: 'Low Value',
    color: 'gray',
    icon: '○',
    recommendation: 'Consider skipping unless special circumstances apply',
  },
}

/**
 * Classify strategic value into actionable tier
 *
 * Algorithm:
 * - ROI ≥ 5.0 → BEST_BET (apply ASAP)
 * - ROI 3.0-4.9 → HIGH_VALUE (strong candidates)
 * - ROI 1.5-2.9 → MEDIUM_VALUE (if time permits)
 * - ROI < 1.5 → LOW_VALUE (probably skip)
 *
 * @param strategicValue - Strategic value score (0-10)
 * @returns Classification with tier, label, color, and recommendation
 */
export function classifyStrategicValue(strategicValue: number): StrategicValueClassification {
  let tier: StrategicValueTier

  if (strategicValue >= TIER_THRESHOLDS.BEST_BET) {
    tier = 'BEST_BET'
  } else if (strategicValue >= TIER_THRESHOLDS.HIGH_VALUE) {
    tier = 'HIGH_VALUE'
  } else if (strategicValue >= TIER_THRESHOLDS.MEDIUM_VALUE) {
    tier = 'MEDIUM_VALUE'
  } else {
    tier = 'LOW_VALUE'
  }

  const config = TIER_CONFIG[tier]

  return {
    tier,
    value: strategicValue,
    ...config,
  }
}

/**
 * Format strategic value display string
 *
 * Format: "Strategic Value: {Tier} - ${awardAmount} award, {probability}% probability, {effort} effort ({breakdown})"
 *
 * @param params - Display parameters
 * @returns Formatted display string
 */
export function formatStrategicValueDisplay(params: {
  tier: StrategicValueTier
  awardAmount: number
  successProbability: number
  effortLevel: string
  effortBreakdown: {
    essays: number
    documents: number
    recommendations: number
  }
}): string {
  const { tier, awardAmount, successProbability, effortLevel, effortBreakdown } = params
  const config = TIER_CONFIG[tier]

  // Format award amount with commas
  const formattedAward = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(awardAmount)

  // Format probability as percentage
  const formattedProbability = Math.round(successProbability)

  // Build breakdown text
  const breakdownParts: string[] = []
  if (effortBreakdown.essays > 0) {
    breakdownParts.push(`${effortBreakdown.essays} essay${effortBreakdown.essays > 1 ? 's' : ''}`)
  }
  if (effortBreakdown.documents > 0) {
    breakdownParts.push(`${effortBreakdown.documents} doc${effortBreakdown.documents > 1 ? 's' : ''}`)
  }
  if (effortBreakdown.recommendations > 0) {
    breakdownParts.push(
      `${effortBreakdown.recommendations} rec${effortBreakdown.recommendations > 1 ? 's' : ''}`
    )
  }
  const breakdownText = breakdownParts.length > 0 ? breakdownParts.join(', ') : 'no requirements'

  return `Strategic Value: ${config.label} - ${formattedAward} award, ${formattedProbability}% success probability, ${effortLevel} effort (${breakdownText})`
}

/**
 * Get tier color for Tailwind CSS classes
 *
 * @param tier - Strategic value tier
 * @returns Tailwind color classes
 */
export function getTierColorClasses(tier: StrategicValueTier): {
  bg: string
  text: string
  border: string
} {
  switch (tier) {
    case 'BEST_BET':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-300 dark:border-yellow-700',
      }
    case 'HIGH_VALUE':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-300 dark:border-green-700',
      }
    case 'MEDIUM_VALUE':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-800 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-700',
      }
    case 'LOW_VALUE':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-600',
      }
  }
}
