/**
 * Success Probability Badge Component
 *
 * Displays success probability percentage with tier-based color coding:
 * - Strong Match (70-100%): Green
 * - Competitive Match (40-69%): Blue
 * - Reach (10-39%): Orange
 * - Long-Shot (<10%): Red
 *
 * Story 2.5: Success Probability Prediction
 *
 * @module components/matching/SuccessProbabilityBadge
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SuccessTier = 'STRONG_MATCH' | 'COMPETITIVE_MATCH' | 'REACH' | 'LONG_SHOT'

interface SuccessProbabilityBadgeProps {
  /** Success probability percentage (0-100) */
  probability: number
  /** Success tier classification */
  tier: SuccessTier
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show tier label alongside percentage */
  showLabel?: boolean
  /** Optional className for custom styling */
  className?: string
}

/**
 * Get tier display metadata
 */
function getTierMetadata(tier: SuccessTier): {
  label: string
  color: string
  description: string
} {
  switch (tier) {
    case 'STRONG_MATCH':
      return {
        label: 'Strong Match',
        color: 'bg-green-100 text-green-800 border-green-300',
        description: 'Apply immediately, high confidence',
      }
    case 'COMPETITIVE_MATCH':
      return {
        label: 'Competitive Match',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'Solid opportunity, worth effort',
      }
    case 'REACH':
      return {
        label: 'Reach',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        description: 'Long shot, but possible',
      }
    case 'LONG_SHOT':
      return {
        label: 'Long-Shot',
        color: 'bg-red-100 text-red-800 border-red-300',
        description: 'Very competitive, consider if high value',
      }
  }
}

/**
 * Success Probability Badge
 *
 * @example
 * ```tsx
 * <SuccessProbabilityBadge
 *   probability={72}
 *   tier="STRONG_MATCH"
 *   showLabel
 * />
 * // Renders: Green badge with "72% - Strong Match"
 * ```
 */
export function SuccessProbabilityBadge({
  probability,
  tier,
  size = 'md',
  showLabel = false,
  className,
}: SuccessProbabilityBadgeProps) {
  // Clamp probability to 0-100 range
  const displayProbability = Math.max(0, Math.min(100, Math.round(probability)))

  const tierMetadata = getTierMetadata(tier)

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  return (
    <Badge
      className={cn(
        'font-semibold border',
        tierMetadata.color,
        sizeClasses[size],
        className
      )}
    >
      {displayProbability}%{showLabel && ` - ${tierMetadata.label}`}
    </Badge>
  )
}

/**
 * Success Probability Badge with Full Label
 *
 * Displays badge with tier label and description tooltip
 */
export function SuccessProbabilityBadgeWithLabel({
  probability,
  tier,
  size = 'md',
  className,
}: Omit<SuccessProbabilityBadgeProps, 'showLabel'>) {
  const displayProbability = Math.max(0, Math.min(100, Math.round(probability)))
  const tierMetadata = getTierMetadata(tier)

  return (
    <div className={cn('flex items-center gap-2', className)} title={tierMetadata.description}>
      <SuccessProbabilityBadge
        probability={displayProbability}
        tier={tier}
        size={size}
        showLabel
      />
    </div>
  )
}

/**
 * Compact Success Probability Display
 *
 * Shows just the percentage with color coding, no tier label
 */
export function SuccessProbabilityCompact({
  probability,
  tier,
  className,
}: Omit<SuccessProbabilityBadgeProps, 'size' | 'showLabel'>) {
  return (
    <SuccessProbabilityBadge
      probability={probability}
      tier={tier}
      size="sm"
      showLabel={false}
      className={className}
    />
  )
}
