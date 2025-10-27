/**
 * FilterBar Component (Story 3.3)
 *
 * Filter controls for application dashboard:
 * - Priority tier multi-select
 * - Deadline range picker
 * - Status checkboxes
 * - Active filter count badge
 * - Clear all filters button
 *
 * @component
 */

'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ApplicationStatus, PriorityTier } from '@prisma/client'

export interface FilterState {
  priorityTiers: PriorityTier[]
  deadlineRange: 'all' | 'next_7_days' | 'next_30_days' | 'next_90_days'
  statuses: ApplicationStatus[]
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void
  activeFilters: FilterState
  className?: string
}

const PRIORITY_TIERS: { value: PriorityTier; label: string }[] = [
  { value: 'MUST_APPLY', label: 'Must Apply' },
  { value: 'SHOULD_APPLY', label: 'Should Apply' },
  { value: 'IF_TIME_PERMITS', label: 'If Time Permits' },
  { value: 'HIGH_VALUE_REACH', label: 'High Value Reach' },
]

const DEADLINE_RANGES = [
  { value: 'all', label: 'All Deadlines' },
  { value: 'next_7_days', label: 'Next 7 Days' },
  { value: 'next_30_days', label: 'Next 30 Days' },
  { value: 'next_90_days', label: 'Next 90 Days' },
]

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'READY_FOR_REVIEW', label: 'Ready for Review' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'AWAITING_DECISION', label: 'Awaiting Decision' },
  { value: 'AWARDED', label: 'Awarded' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
]

export function FilterBar({ onFilterChange, activeFilters, className }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate active filter count
  const activeFilterCount =
    (activeFilters.priorityTiers.length > 0 ? 1 : 0) +
    (activeFilters.deadlineRange !== 'all' ? 1 : 0) +
    (activeFilters.statuses.length > 0 ? 1 : 0)

  /**
   * Handle priority tier toggle
   */
  const handlePriorityTierToggle = (tier: PriorityTier) => {
    const newTiers = activeFilters.priorityTiers.includes(tier)
      ? activeFilters.priorityTiers.filter((t) => t !== tier)
      : [...activeFilters.priorityTiers, tier]

    onFilterChange({
      ...activeFilters,
      priorityTiers: newTiers,
    })
  }

  /**
   * Handle deadline range change
   */
  const handleDeadlineRangeChange = (
    range: 'all' | 'next_7_days' | 'next_30_days' | 'next_90_days'
  ) => {
    onFilterChange({
      ...activeFilters,
      deadlineRange: range,
    })
  }

  /**
   * Handle status toggle
   */
  const handleStatusToggle = (status: ApplicationStatus) => {
    const newStatuses = activeFilters.statuses.includes(status)
      ? activeFilters.statuses.filter((s) => s !== status)
      : [...activeFilters.statuses, status]

    onFilterChange({
      ...activeFilters,
      statuses: newStatuses,
    })
  }

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    onFilterChange({
      priorityTiers: [],
      deadlineRange: 'all',
      statuses: [],
    })
    setIsOpen(false)
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <h4 className="font-semibold text-sm">Filter Applications</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Priority Tier Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority Tier</Label>
              <div className="space-y-2">
                {PRIORITY_TIERS.map((tier) => (
                  <div key={tier.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`tier-${tier.value}`}
                      checked={activeFilters.priorityTiers.includes(tier.value)}
                      onCheckedChange={() => handlePriorityTierToggle(tier.value)}
                    />
                    <Label
                      htmlFor={`tier-${tier.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tier.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadline Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deadline Range</Label>
              <Select
                value={activeFilters.deadlineRange}
                onValueChange={(value) =>
                  handleDeadlineRangeChange(
                    value as 'all' | 'next_7_days' | 'next_30_days' | 'next_90_days'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEADLINE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={activeFilters.statuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Badges */}
      {activeFilters.priorityTiers.length > 0 && (
        <Badge variant="outline" className="gap-1">
          Priority: {activeFilters.priorityTiers.length}
          <button
            onClick={() =>
              onFilterChange({
                ...activeFilters,
                priorityTiers: [],
              })
            }
            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {activeFilters.deadlineRange !== 'all' && (
        <Badge variant="outline" className="gap-1">
          {DEADLINE_RANGES.find((r) => r.value === activeFilters.deadlineRange)?.label}
          <button
            onClick={() =>
              onFilterChange({
                ...activeFilters,
                deadlineRange: 'all',
              })
            }
            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {activeFilters.statuses.length > 0 && (
        <Badge variant="outline" className="gap-1">
          Status: {activeFilters.statuses.length}
          <button
            onClick={() =>
              onFilterChange({
                ...activeFilters,
                statuses: [],
              })
            }
            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  )
}
