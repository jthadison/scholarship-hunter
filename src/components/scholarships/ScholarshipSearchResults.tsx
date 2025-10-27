/**
 * Scholarship Search Results Component
 *
 * Displays search results with pagination controls.
 * Responsive grid layout (1 col mobile, 2 tablet, 3 desktop).
 * Shows loading skeleton while searching.
 *
 * Features:
 * - Grid layout with ScholarshipCard components
 * - Pagination (Previous, Next, page numbers)
 * - Results count ("Showing 1-20 of 347 scholarships")
 * - Loading state with skeleton
 *
 * @module components/scholarships/ScholarshipSearchResults
 */

'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScholarshipCard } from './ScholarshipCard'

export interface ScholarshipSearchResultsProps {
  /** Scholarship results */
  scholarships: Array<{
    id: string
    name: string
    provider: string
    awardAmount: number | null
    deadline: Date | null
    description: string | null
    matches?: Array<{
      overallMatchScore: number
      priorityTier: 'MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH'
      strategicValue: number | null
    }>
  }>
  /** Total number of results */
  total: number
  /** Current page (0-indexed) */
  page: number
  /** Results per page */
  limit: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Whether results are loading */
  isLoading?: boolean
}

/**
 * Loading skeleton for search results
 */
function ResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-lg border border-border bg-muted"
        />
      ))}
    </div>
  )
}

/**
 * Search results component
 *
 * Displays scholarships in responsive grid with pagination.
 */
export function ScholarshipSearchResults({
  scholarships,
  total,
  page,
  limit,
  onPageChange,
  isLoading = false,
}: ScholarshipSearchResultsProps) {
  // Calculate pagination values
  const start = page * limit + 1
  const end = Math.min((page + 1) * limit, total)
  const totalPages = Math.ceil(total / limit)
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
        <ResultsSkeleton />
      </div>
    )
  }

  // Empty state (handled separately in EmptySearchState component)
  if (scholarships.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {start}-{end} of {total} scholarships
        </p>
      </div>

      {/* Results grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {scholarships.map((scholarship) => (
          <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((p) => {
                // Show first page, last page, current page, and pages near current
                return (
                  p === 0 ||
                  p === totalPages - 1 ||
                  Math.abs(p - page) <= 1
                )
              })
              .map((p, i, arr) => {
                // Add ellipsis if gap between pages
                const prevPage = arr[i - 1]
                const showEllipsis = prevPage !== undefined && p - prevPage > 1

                return (
                  <div key={p} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 text-sm text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(p)}
                      className="min-w-[2.5rem]"
                    >
                      {p + 1}
                    </Button>
                  </div>
                )
              })}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
