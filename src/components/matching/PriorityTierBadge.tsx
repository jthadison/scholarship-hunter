/**
 * Priority Tier Badge Component
 *
 * Displays priority tier with color coding to guide application strategy:
 * - MUST_APPLY: Green (exceptional matches, high priority)
 * - SHOULD_APPLY: Blue (strong matches, second priority)
 * - IF_TIME_PERMITS: Yellow (decent matches, lower priority)
 * - HIGH_VALUE_REACH: Orange (high-value risks, calculated reach)
 *
 * Story 2.7: Priority Tiering System
 *
 * @module components/matching/PriorityTierBadge
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PriorityTier } from '@prisma/client'

interface PriorityTierBadgeProps {
  /** Priority tier classification */
  tier: PriorityTier
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show full tier label vs compact */
  showFullLabel?: boolean
  /** Optional className for custom styling */
  className?: string
}

/**
 * Get tier display metadata
 */
function getTierMetadata(tier: PriorityTier): {
  label: string
  shortLabel: string
  color: string
  description: string
} {
  switch (tier) {
    case PriorityTier.MUST_APPLY:
      return {
        label: 'Must Apply',
        shortLabel: 'Must Apply',
        color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700',
        description: 'Exceptional match with high success probability - top priority',
      }
    case PriorityTier.SHOULD_APPLY:
      return {
        label: 'Should Apply',
        shortLabel: 'Should Apply',
        color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700',
        description: 'Strong match with competitive success probability - second priority',
      }
    case PriorityTier.IF_TIME_PERMITS:
      return {
        label: 'If Time Permits',
        shortLabel: 'If Time',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700',
        description: 'Decent match - apply if time allows',
      }
    case PriorityTier.HIGH_VALUE_REACH:
      return {
        label: 'High-Value Reach',
        shortLabel: 'Reach',
        color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700',
        description: 'High-value opportunity worth the calculated risk',
      }
  }
}

/**
 * Priority Tier Badge
 *
 * @example
 * ```tsx
 * <PriorityTierBadge tier="MUST_APPLY" showFullLabel />
 * // Renders: Green badge with "Must Apply"
 *
 * <PriorityTierBadge tier="HIGH_VALUE_REACH" size="sm" />
 * // Renders: Orange badge with "Reach"
 * ```
 */
export function PriorityTierBadge({
  tier,
  size = 'md',
  showFullLabel = true,
  className,
}: PriorityTierBadgeProps) {
  const tierMetadata = getTierMetadata(tier)

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  const label = showFullLabel ? tierMetadata.label : tierMetadata.shortLabel

  return (
    <Badge
      className={cn(
        'font-semibold border',
        tierMetadata.color,
        sizeClasses[size],
        className
      )}
      title={tierMetadata.description}
    >
      {label}
    </Badge>
  )
}

/**
 * Priority Tier Badge with Tooltip
 *
 * Displays badge with full description on hover
 */
export function PriorityTierBadgeWithTooltip({
  tier,
  size = 'md',
  className,
}: Omit<PriorityTierBadgeProps, 'showFullLabel'>) {
  const tierMetadata = getTierMetadata(tier)

  return (
    <div className={cn('inline-flex items-center', className)} title={tierMetadata.description}>
      <PriorityTierBadge tier={tier} size={size} showFullLabel />
    </div>
  )
}

/**
 * Compact Priority Tier Display
 *
 * Shows just short label with color coding
 */
export function PriorityTierCompact({
  tier,
  className,
}: Omit<PriorityTierBadgeProps, 'size' | 'showFullLabel'>) {
  return (
    <PriorityTierBadge
      tier={tier}
      size="sm"
      showFullLabel={false}
      className={className}
    />
  )
}

/**
 * Get tier color class for custom styling
 *
 * Utility function to get color classes for tier outside of badge component
 */
export function getTierColorClass(tier: PriorityTier): string {
  return getTierMetadata(tier).color
}
