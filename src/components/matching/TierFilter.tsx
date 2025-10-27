/**
 * Tier Filter Component
 *
 * Provides UI controls for filtering scholarships by priority tier.
 * Supports single-tier, multi-tier, and quick-filter modes.
 *
 * Story 2.7: Priority Tiering System
 *
 * @module components/matching/TierFilter
 */

'use client'

import { PriorityTier } from '@prisma/client'
import { PriorityTierBadge } from './PriorityTierBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface TierFilterProps {
  /** Currently selected tiers */
  selectedTiers: PriorityTier[]
  /** Callback when tier selection changes */
  onTierChange: (tiers: PriorityTier[]) => void
  /** Allow multiple tier selection */
  multiSelect?: boolean
  /** Show quick filter for MUST_APPLY */
  showQuickFilter?: boolean
  /** Optional className for custom styling */
  className?: string
}

const ALL_TIERS: PriorityTier[] = [
  PriorityTier.MUST_APPLY,
  PriorityTier.SHOULD_APPLY,
  PriorityTier.IF_TIME_PERMITS,
  PriorityTier.HIGH_VALUE_REACH,
]

/**
 * Tier Filter Component
 *
 * @example
 * ```tsx
 * <TierFilter
 *   selectedTiers={[PriorityTier.MUST_APPLY]}
 *   onTierChange={(tiers) => setSelectedTiers(tiers)}
 *   multiSelect
 *   showQuickFilter
 * />
 * ```
 */
export function TierFilter({
  selectedTiers,
  onTierChange,
  multiSelect = false,
  showQuickFilter = false,
  className,
}: TierFilterProps) {
  const handleTierToggle = (tier: PriorityTier) => {
    if (multiSelect) {
      // Multi-select mode: toggle tier in array
      if (selectedTiers.includes(tier)) {
        onTierChange(selectedTiers.filter((t) => t !== tier))
      } else {
        onTierChange([...selectedTiers, tier])
      }
    } else {
      // Single-select mode: select only this tier, or clear if already selected
      if (selectedTiers.includes(tier) && selectedTiers.length === 1) {
        onTierChange([]) // Clear selection
      } else {
        onTierChange([tier])
      }
    }
  }

  const handleClearAll = () => {
    onTierChange([])
  }

  const handleSelectAll = () => {
    onTierChange(ALL_TIERS)
  }

  const handleQuickFilterMustApply = () => {
    onTierChange([PriorityTier.MUST_APPLY])
  }

  const hasSelection = selectedTiers.length > 0
  const allSelected = selectedTiers.length === ALL_TIERS.length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quick filter button (AC#4: "Show only MUST_APPLY" quick filter) */}
      {showQuickFilter && (
        <Button
          variant={selectedTiers.length === 1 && selectedTiers[0] === PriorityTier.MUST_APPLY ? 'default' : 'outline'}
          size="sm"
          onClick={handleQuickFilterMustApply}
          className="w-full sm:w-auto"
        >
          Show only Must Apply
        </Button>
      )}

      {/* Tier selection grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Filter by Priority</span>
          {multiSelect && (
            <div className="flex gap-2">
              {hasSelection && !allSelected && (
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
              )}
              {hasSelection && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_TIERS.map((tier) => {
            const isSelected = selectedTiers.includes(tier)
            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierToggle(tier)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-md border-2 transition-all',
                  'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                )}
              >
                <PriorityTierBadge tier={tier} size="sm" />
                {isSelected && multiSelect && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selection summary */}
      {hasSelection && (
        <div className="text-xs text-muted-foreground">
          {selectedTiers.length === 1
            ? 'Showing 1 tier'
            : `Showing ${selectedTiers.length} tiers`}
        </div>
      )}
    </div>
  )
}

/**
 * Compact Tier Filter Pills
 *
 * Horizontal pill-style filter for toolbars
 */
export function TierFilterPills({
  selectedTiers,
  onTierChange,
  className,
}: Pick<TierFilterProps, 'selectedTiers' | 'onTierChange' | 'className'>) {
  const handleToggle = (tier: PriorityTier) => {
    if (selectedTiers.includes(tier)) {
      onTierChange(selectedTiers.filter((t) => t !== tier))
    } else {
      onTierChange([...selectedTiers, tier])
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {ALL_TIERS.map((tier) => {
        const isSelected = selectedTiers.includes(tier)
        return (
          <button
            key={tier}
            type="button"
            onClick={() => handleToggle(tier)}
            className={cn(
              'transition-opacity',
              !isSelected && 'opacity-50 hover:opacity-100'
            )}
          >
            <PriorityTierBadge tier={tier} size="sm" showFullLabel={false} />
          </button>
        )
      })}
      {selectedTiers.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTierChange([])}
          className="h-auto py-0.5 px-2 text-xs"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
