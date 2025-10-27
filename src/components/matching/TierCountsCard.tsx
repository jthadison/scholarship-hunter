/**
 * Tier Counts Card Component
 *
 * Dashboard widget displaying scholarship match counts by priority tier
 * with color-coded statistics and visual hierarchy.
 *
 * Story 2.7: Priority Tiering System
 *
 * @module components/matching/TierCountsCard
 */

'use client'

import { Card } from '@/components/ui/card'
import { PriorityTierBadge } from './PriorityTierBadge'
import { PriorityTier } from '@prisma/client'
import { cn } from '@/lib/utils'

interface TierCounts {
  MUST_APPLY: number
  SHOULD_APPLY: number
  IF_TIME_PERMITS: number
  HIGH_VALUE_REACH: number
}

interface TierCountsCardProps {
  /** Tier count data from API */
  tierCounts: TierCounts
  /** Optional click handler for tier filtering */
  onTierClick?: (tier: PriorityTier) => void
  /** Loading state */
  loading?: boolean
  /** Optional className for custom styling */
  className?: string
}

/**
 * Tier count row component
 */
function TierCountRow({
  tier,
  count,
  onClick,
}: {
  tier: PriorityTier
  count: number
  onClick?: (tier: PriorityTier) => void
}) {
  const isClickable = !!onClick && count > 0

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-md transition-colors',
        isClickable && 'cursor-pointer hover:bg-accent',
        !isClickable && 'opacity-60'
      )}
      onClick={() => isClickable && onClick(tier)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(tier)
        }
      }}
    >
      <PriorityTierBadge tier={tier} size="sm" showFullLabel />
      <span
        className={cn(
          'text-2xl font-bold tabular-nums',
          count === 0 && 'text-muted-foreground'
        )}
      >
        {count}
      </span>
    </div>
  )
}

/**
 * Tier Counts Card
 *
 * @example
 * ```tsx
 * <TierCountsCard
 *   tierCounts={{
 *     MUST_APPLY: 5,
 *     SHOULD_APPLY: 12,
 *     IF_TIME_PERMITS: 23,
 *     HIGH_VALUE_REACH: 4
 *   }}
 *   onTierClick={(tier) => router.push(`/matches?tier=${tier}`)}
 * />
 * ```
 */
export function TierCountsCard({
  tierCounts,
  onTierClick,
  loading = false,
  className,
}: TierCountsCardProps) {
  const totalMatches =
    tierCounts.MUST_APPLY +
    tierCounts.SHOULD_APPLY +
    tierCounts.IF_TIME_PERMITS +
    tierCounts.HIGH_VALUE_REACH

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Priority Tiers</h3>
          <div className="text-sm text-muted-foreground">
            {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
          </div>
        </div>

        {/* Tier rows */}
        <div className="space-y-1">
          <TierCountRow
            tier={PriorityTier.MUST_APPLY}
            count={tierCounts.MUST_APPLY}
            onClick={onTierClick}
          />
          <TierCountRow
            tier={PriorityTier.SHOULD_APPLY}
            count={tierCounts.SHOULD_APPLY}
            onClick={onTierClick}
          />
          <TierCountRow
            tier={PriorityTier.IF_TIME_PERMITS}
            count={tierCounts.IF_TIME_PERMITS}
            onClick={onTierClick}
          />
          <TierCountRow
            tier={PriorityTier.HIGH_VALUE_REACH}
            count={tierCounts.HIGH_VALUE_REACH}
            onClick={onTierClick}
          />
        </div>

        {/* Help text */}
        {totalMatches === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No matches yet. Complete your profile to discover scholarships!
          </div>
        )}

        {totalMatches > 0 && onTierClick && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Click a tier to filter scholarships
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Compact Tier Summary
 *
 * Single-line summary for smaller displays
 */
export function TierCountsSummary({
  tierCounts,
  className,
}: Pick<TierCountsCardProps, 'tierCounts' | 'className'>) {
  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-1.5">
        <PriorityTierBadge tier={PriorityTier.MUST_APPLY} size="sm" showFullLabel={false} />
        <span className="font-semibold">{tierCounts.MUST_APPLY}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <PriorityTierBadge tier={PriorityTier.SHOULD_APPLY} size="sm" showFullLabel={false} />
        <span className="font-semibold">{tierCounts.SHOULD_APPLY}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <PriorityTierBadge tier={PriorityTier.IF_TIME_PERMITS} size="sm" showFullLabel={false} />
        <span className="font-semibold">{tierCounts.IF_TIME_PERMITS}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <PriorityTierBadge tier={PriorityTier.HIGH_VALUE_REACH} size="sm" showFullLabel={false} />
        <span className="font-semibold">{tierCounts.HIGH_VALUE_REACH}</span>
      </div>
    </div>
  )
}
