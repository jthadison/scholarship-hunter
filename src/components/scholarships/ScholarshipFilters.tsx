/**
 * Scholarship Filters Component
 *
 * Comprehensive filter controls for scholarship search:
 * - Award amount range slider
 * - Deadline date range picker
 * - Priority tier checkboxes
 * - Match score minimum slider
 * - Effort level radio buttons
 * - Major/field dropdown
 *
 * Mobile responsive with collapsible sections.
 *
 * @module components/scholarships/ScholarshipFilters
 */

'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/shared/components/ui/separator'

export interface SearchFilters {
  minAward?: number
  maxAward?: number
  minDeadline?: Date
  maxDeadline?: Date
  priorityTier?: ('MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH')[]
  minMatchScore?: number
  effortLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  major?: string
}

export interface ScholarshipFiltersProps {
  /** Current filter values */
  filters: SearchFilters
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilters) => void
  /** Whether user is authenticated (affects which filters are shown) */
  isAuthenticated?: boolean
}

/**
 * Filter sidebar component
 *
 * Collapsible sections for different filter types.
 * Mobile: Render in sheet/drawer. Desktop: Sidebar.
 */
export function ScholarshipFilters({
  filters,
  onFiltersChange,
  isAuthenticated = false,
}: ScholarshipFiltersProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    award: true,
    deadline: true,
    priority: isAuthenticated,
    match: isAuthenticated,
    effort: true,
    major: true,
  })

  // Toggle section open/closed
  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({})
  }

  // Update award range
  const updateAwardRange = (min?: number, max?: number) => {
    onFiltersChange({
      ...filters,
      minAward: min,
      maxAward: max,
    })
  }

  // Update priority tier (multi-select)
  const togglePriorityTier = (
    tier: 'MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH'
  ) => {
    const current = filters.priorityTier || []
    const updated = current.includes(tier)
      ? current.filter((t) => t !== tier)
      : [...current, tier]

    onFiltersChange({
      ...filters,
      priorityTier: updated.length > 0 ? updated : undefined,
    })
  }

  // Update effort level (single select)
  const updateEffortLevel = (level: SearchFilters['effortLevel']) => {
    onFiltersChange({
      ...filters,
      effortLevel: filters.effortLevel === level ? undefined : level,
    })
  }

  // Check if any filters are active
  const hasActiveFilters =
    filters.minAward !== undefined ||
    filters.maxAward !== undefined ||
    filters.minDeadline !== undefined ||
    filters.maxDeadline !== undefined ||
    (filters.priorityTier && filters.priorityTier.length > 0) ||
    filters.minMatchScore !== undefined ||
    filters.effortLevel !== undefined ||
    filters.major !== undefined

  return (
    <div className="space-y-4">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-sm"
          >
            <X className="mr-1 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Award Amount Range */}
      <Collapsible
        open={openSections.award}
        onOpenChange={() => toggleSection('award')}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <span className="font-medium">Award Amount</span>
          {openSections.award ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label htmlFor="min-award" className="text-sm">
              Minimum (${(filters.minAward || 0).toLocaleString()})
            </Label>
            <input
              id="min-award"
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={filters.minAward || 0}
              onChange={(e) => updateAwardRange(Number(e.target.value), filters.maxAward)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-award" className="text-sm">
              Maximum (${(filters.maxAward || 50000).toLocaleString()})
            </Label>
            <input
              id="max-award"
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={filters.maxAward || 50000}
              onChange={(e) => updateAwardRange(filters.minAward, Number(e.target.value))}
              className="w-full"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Priority Tier (authenticated users only) */}
      {isAuthenticated && (
        <>
          <Collapsible
            open={openSections.priority}
            onOpenChange={() => toggleSection('priority')}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
              <span className="font-medium">Priority Tier</span>
              {openSections.priority ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {[
                { value: 'MUST_APPLY' as const, label: 'Must Apply', color: 'text-green-600' },
                {
                  value: 'SHOULD_APPLY' as const,
                  label: 'Should Apply',
                  color: 'text-blue-600',
                },
                {
                  value: 'IF_TIME_PERMITS' as const,
                  label: 'If Time Permits',
                  color: 'text-yellow-600',
                },
                {
                  value: 'HIGH_VALUE_REACH' as const,
                  label: 'High Value Reach',
                  color: 'text-purple-600',
                },
              ].map((tier) => (
                <div key={tier.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tier-${tier.value}`}
                    checked={filters.priorityTier?.includes(tier.value)}
                    onCheckedChange={() => togglePriorityTier(tier.value)}
                  />
                  <Label
                    htmlFor={`tier-${tier.value}`}
                    className={`text-sm font-normal ${tier.color}`}
                  >
                    {tier.label}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
          <Separator />
        </>
      )}

      {/* Match Score Minimum (authenticated users only) */}
      {isAuthenticated && (
        <>
          <Collapsible
            open={openSections.match}
            onOpenChange={() => toggleSection('match')}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
              <span className="font-medium">Match Score</span>
              {openSections.match ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="min-match-score" className="text-sm">
                  Minimum Score ({filters.minMatchScore || 0}%)
                </Label>
                <input
                  id="min-match-score"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filters.minMatchScore || 0}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, minMatchScore: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
          <Separator />
        </>
      )}

      {/* Effort Level */}
      <Collapsible
        open={openSections.effort}
        onOpenChange={() => toggleSection('effort')}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <span className="font-medium">Effort Level</span>
          {openSections.effort ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {[
            { value: 'LOW' as const, label: 'Low (0-1 essays)', desc: '2-3 hours' },
            { value: 'MEDIUM' as const, label: 'Medium (2 essays)', desc: '4-6 hours' },
            { value: 'HIGH' as const, label: 'High (3+ essays)', desc: '8+ hours' },
          ].map((level) => (
            <div key={level.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`effort-${level.value}`}
                name="effort-level"
                checked={filters.effortLevel === level.value}
                onChange={() => updateEffortLevel(level.value)}
                className="h-4 w-4"
              />
              <Label
                htmlFor={`effort-${level.value}`}
                className="flex flex-col text-sm font-normal"
              >
                <span>{level.label}</span>
                <span className="text-xs text-muted-foreground">{level.desc}</span>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
