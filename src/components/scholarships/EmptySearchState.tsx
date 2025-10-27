/**
 * Empty Search State Component
 *
 * Displays helpful message when no scholarships match search filters.
 * Provides actionable suggestions to help users adjust their criteria.
 *
 * States:
 * - No results: "No scholarships match your filters"
 * - Initial state: "Search for scholarships above"
 * - Error state: User-friendly error message
 *
 * @module components/scholarships/EmptySearchState
 */

'use client'

import { Search, AlertCircle, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EmptySearchStateProps {
  /** Type of empty state */
  variant: 'no-results' | 'initial' | 'error'
  /** Callback when "Clear Filters" is clicked */
  onClearFilters?: () => void
  /** Callback when "Retry" is clicked (for error state) */
  onRetry?: () => void
  /** Custom error message (for error state) */
  errorMessage?: string
}

/**
 * Empty state component with helpful messaging
 */
export function EmptySearchState({
  variant,
  onClearFilters,
  onRetry,
  errorMessage,
}: EmptySearchStateProps) {
  // No results state
  if (variant === 'no-results') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No scholarships match your filters</h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Try adjusting your search criteria or clearing some filters to see more results.
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  // Initial state (no search performed)
  if (variant === 'initial') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Start exploring scholarships</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Use the search bar above to find scholarships, or apply filters to narrow down your
          options.
        </p>
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs">STEM scholarships</code>
            <code className="rounded bg-muted px-2 py-1 text-xs">women in engineering</code>
            <code className="rounded bg-muted px-2 py-1 text-xs">financial need</code>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (variant === 'error') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-12 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {errorMessage || 'Failed to load scholarships. Please try again.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    )
  }

  return null
}
