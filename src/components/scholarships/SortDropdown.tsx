/**
 * Sort Dropdown Component
 *
 * Dropdown for selecting scholarship sort order:
 * - Match Score (High to Low) - default for authenticated users
 * - Award Amount (High to Low)
 * - Deadline (Soonest First)
 * - Strategic Value (High to Low) - authenticated only
 *
 * Persists selection in URL query params.
 *
 * @module components/scholarships/SortDropdown
 */

'use client'

import { Check, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export type SortOption = 'match' | 'amount' | 'deadline' | 'strategicValue'

export interface SortDropdownProps {
  /** Current sort option */
  value: SortOption
  /** Callback when sort changes */
  onChange: (sort: SortOption) => void
  /** Whether user is authenticated (affects available options) */
  isAuthenticated?: boolean
}

// Sort option metadata
const SORT_OPTIONS: Array<{
  value: SortOption
  label: string
  description: string
  requiresAuth: boolean
}> = [
  {
    value: 'match',
    label: 'Match Score',
    description: 'Best matches first',
    requiresAuth: true,
  },
  {
    value: 'amount',
    label: 'Award Amount',
    description: 'Highest to lowest',
    requiresAuth: false,
  },
  {
    value: 'deadline',
    label: 'Deadline',
    description: 'Soonest first',
    requiresAuth: false,
  },
  {
    value: 'strategicValue',
    label: 'Strategic Value',
    description: 'Best ROI first',
    requiresAuth: true,
  },
]

/**
 * Sort dropdown component
 *
 * Shows active sort with checkmark.
 * Filters options based on authentication status.
 */
export function SortDropdown({ value, onChange, isAuthenticated = false }: SortDropdownProps) {
  // Filter sort options based on authentication
  const availableOptions = SORT_OPTIONS.filter(
    (option) => !option.requiresAuth || isAuthenticated
  )

  // Get label for current sort
  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label || 'Sort by'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
            {value === option.value && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
