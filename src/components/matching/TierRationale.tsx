/**
 * Tier Rationale Component
 *
 * Displays a clear explanation for why a scholarship was assigned a specific
 * priority tier, showing the contributing factors (match score, success probability,
 * strategic value, award amount).
 *
 * Story 2.7: Priority Tiering System (AC#6)
 *
 * @module components/matching/TierRationale
 */

'use client'

import { PriorityTier } from '@prisma/client'
import { PriorityTierBadge } from './PriorityTierBadge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Target, TrendingUp, DollarSign, Award } from 'lucide-react'

interface TierRationaleProps {
  /** Priority tier */
  tier: PriorityTier
  /** Match score (0-100) */
  matchScore: number
  /** Success probability (0-1) */
  successProbability: number
  /** Strategic value score */
  strategicValue: number
  /** Award amount in dollars */
  awardAmount: number
  /** Display mode: full card or inline */
  mode?: 'card' | 'inline'
  /** Optional className for custom styling */
  className?: string
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get tier explanation
 */
function getTierExplanation(tier: PriorityTier): string {
  switch (tier) {
    case PriorityTier.MUST_APPLY:
      return 'Exceptional match with high success probability and strong ROI. This is a top priority opportunity.'
    case PriorityTier.SHOULD_APPLY:
      return 'Strong match with competitive success probability. This is a solid second-priority opportunity.'
    case PriorityTier.IF_TIME_PERMITS:
      return 'Decent match with moderate success probability. Apply if time allows after higher priorities.'
    case PriorityTier.HIGH_VALUE_REACH:
      return 'High-value opportunity with lower probability. Worth the calculated risk for the significant award.'
  }
}

/**
 * Metric display component
 */
function MetricDisplay({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: any
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md',
        highlight && 'bg-primary/5 border border-primary/20'
      )}
    >
      <Icon className={cn('h-4 w-4', highlight ? 'text-primary' : 'text-muted-foreground')} />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn('text-sm font-semibold', highlight && 'text-primary')}>{value}</div>
      </div>
    </div>
  )
}

/**
 * Tier Rationale Component
 *
 * @example
 * ```tsx
 * <TierRationale
 *   tier={PriorityTier.MUST_APPLY}
 *   matchScore={94}
 *   successProbability={0.72}
 *   strategicValue={5.0}
 *   awardAmount={5000}
 *   mode="card"
 * />
 * ```
 */
export function TierRationale({
  tier,
  matchScore,
  successProbability,
  strategicValue,
  awardAmount,
  mode = 'card',
  className,
}: TierRationaleProps) {
  const probabilityPercent = Math.round(successProbability * 100)
  const formattedAmount = formatCurrency(awardAmount)
  const explanation = getTierExplanation(tier)

  // Determine which metrics contributed to this tier
  const highlightMatchScore = tier === PriorityTier.MUST_APPLY && matchScore >= 90
  const highlightProbability =
    (tier === PriorityTier.MUST_APPLY && successProbability >= 0.7) ||
    (tier === PriorityTier.SHOULD_APPLY && successProbability >= 0.4)
  const highlightStrategicValue = tier === PriorityTier.MUST_APPLY && strategicValue >= 3.0
  const highlightAwardAmount = tier === PriorityTier.HIGH_VALUE_REACH && awardAmount >= 10000

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <PriorityTierBadge tier={tier} size="md" />
        <p className="text-sm text-muted-foreground">{explanation}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricDisplay
          icon={Target}
          label="Match Score"
          value={`${Math.round(matchScore)}`}
          highlight={highlightMatchScore}
        />
        <MetricDisplay
          icon={TrendingUp}
          label="Success Rate"
          value={`${probabilityPercent}%`}
          highlight={highlightProbability}
        />
        <MetricDisplay
          icon={Award}
          label="Strategic Value"
          value={strategicValue.toFixed(1)}
          highlight={highlightStrategicValue}
        />
        <MetricDisplay
          icon={DollarSign}
          label="Award Amount"
          value={formattedAmount}
          highlight={highlightAwardAmount}
        />
      </div>

      {/* Highlighted factors */}
      <div className="text-xs text-muted-foreground">
        {tier === PriorityTier.MUST_APPLY && (
          <span>
            ✓ Meets all criteria: High match (90+), High probability (70%+), Strong ROI (3.0+)
          </span>
        )}
        {tier === PriorityTier.SHOULD_APPLY && (
          <span>✓ Meets criteria: Good match (75+), Competitive probability (40%+)</span>
        )}
        {tier === PriorityTier.HIGH_VALUE_REACH && (
          <span>✓ High-value opportunity: Award $10,000+, worth strategic risk</span>
        )}
        {tier === PriorityTier.IF_TIME_PERMITS && (
          <span>Consider applying if you have capacity after higher priorities</span>
        )}
      </div>
    </div>
  )

  if (mode === 'inline') {
    return <div className={cn('space-y-3', className)}>{content}</div>
  }

  return (
    <Card className={cn('p-4', className)}>
      {content}
    </Card>
  )
}

/**
 * Compact Tier Rationale Tooltip
 *
 * Single-line summary for tooltips
 */
export function getTierRationaleSummary(
  tier: PriorityTier,
  matchScore: number,
  successProbability: number,
  strategicValue: number,
  awardAmount: number
): string {
  const probabilityPercent = Math.round(successProbability * 100)
  const formattedAmount = formatCurrency(awardAmount)

  return `${tier.replace(/_/g, ' ')}: ${Math.round(matchScore)} match, ${formattedAmount} award, ${probabilityPercent}% success probability, ${strategicValue.toFixed(1)} strategic value`
}
