import { PriorityTier } from "@prisma/client";

/**
 * Assigns a priority tier to a scholarship match based on multi-dimensional criteria.
 *
 * Priority Tier Logic:
 * - MUST_APPLY: Match ≥90, Probability ≥70%, Strategic Value ≥3.0
 * - SHOULD_APPLY: Match ≥75, Probability ≥40%
 * - HIGH_VALUE_REACH: Award ≥$10,000, Probability <25%
 * - IF_TIME_PERMITS: Default fallback for all other cases
 *
 * @param matchScore - Overall match score (0-100)
 * @param successProbability - Probability of success (0.0-1.0)
 * @param strategicValue - ROI-based strategic value score
 * @param awardAmount - Scholarship award amount in dollars
 * @returns PriorityTier enum value
 *
 * @example
 * assignPriorityTier(94, 0.72, 5.0, 5000) // Returns MUST_APPLY
 * assignPriorityTier(80, 0.5, 2.5, 3000)  // Returns SHOULD_APPLY
 * assignPriorityTier(55, 0.15, 1.8, 15000) // Returns HIGH_VALUE_REACH
 * assignPriorityTier(65, 0.3, 2.0, 2000)  // Returns IF_TIME_PERMITS
 */
export function assignPriorityTier(
  matchScore: number,
  successProbability: number,
  strategicValue: number,
  awardAmount: number
): PriorityTier {
  // MUST_APPLY: Exceptional matches with high success probability and solid ROI
  // Criteria: Match ≥90 AND Probability ≥70% AND Strategic Value ≥3.0
  if (
    matchScore >= 90 &&
    successProbability >= 0.7 &&
    strategicValue >= 3.0
  ) {
    return PriorityTier.MUST_APPLY;
  }

  // SHOULD_APPLY: Strong matches with competitive success probability
  // Criteria: Match ≥75 AND Probability ≥40%
  if (matchScore >= 75 && successProbability >= 0.4) {
    return PriorityTier.SHOULD_APPLY;
  }

  // HIGH_VALUE_REACH: High-value scholarships with lower probability - calculated risks
  // Criteria: Award ≥$10,000 AND Probability <25%
  if (awardAmount >= 10000 && successProbability < 0.25) {
    return PriorityTier.HIGH_VALUE_REACH;
  }

  // IF_TIME_PERMITS: Default fallback for all other cases
  // Decent matches with moderate success probability - apply if time allows
  return PriorityTier.IF_TIME_PERMITS;
}

/**
 * Generates a human-readable explanation for why a scholarship was assigned a specific tier.
 *
 * @param tier - The assigned priority tier
 * @param matchScore - Overall match score (0-100)
 * @param successProbability - Probability of success (0.0-1.0)
 * @param strategicValue - ROI-based strategic value score
 * @param awardAmount - Scholarship award amount in dollars
 * @returns Explanation string describing the tier assignment rationale
 *
 * @example
 * getTierRationale(PriorityTier.MUST_APPLY, 94, 0.72, 5.0, 5000)
 * // Returns "MUST_APPLY: 94 match, $5,000 award, 72% success probability, 5.0 strategic value"
 */
export function getTierRationale(
  tier: PriorityTier,
  matchScore: number,
  successProbability: number,
  strategicValue: number,
  awardAmount: number
): string {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(awardAmount);

  const probabilityPercent = Math.round(successProbability * 100);

  const baseRationale = `${Math.round(matchScore)} match, ${formattedAmount} award, ${probabilityPercent}% success probability`;

  switch (tier) {
    case PriorityTier.MUST_APPLY:
      return `MUST_APPLY: ${baseRationale}, ${strategicValue.toFixed(1)} strategic value - Exceptional match with high probability and strong ROI`;

    case PriorityTier.SHOULD_APPLY:
      return `SHOULD_APPLY: ${baseRationale} - Strong match with competitive probability`;

    case PriorityTier.HIGH_VALUE_REACH:
      return `HIGH_VALUE_REACH: ${baseRationale} - High-value opportunity worth the calculated risk`;

    case PriorityTier.IF_TIME_PERMITS:
      return `IF_TIME_PERMITS: ${baseRationale} - Decent match, apply if time allows`;

    default:
      return `${tier}: ${baseRationale}`;
  }
}
