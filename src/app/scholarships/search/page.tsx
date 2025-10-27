/**
 * Scholarship Search Page
 *
 * Main search interface for discovering scholarships.
 * Combines search bar, filters, sort controls, and results display.
 *
 * Features:
 * - Natural language search with Meilisearch
 * - Multi-dimensional filtering (award, deadline, tier, effort, etc.)
 * - Multiple sort options
 * - URL-driven state (shareable links)
 * - Responsive layout (mobile + desktop)
 * - <1 second search performance
 *
 * @module app/scholarships/search
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trpc } from '@/shared/lib/trpc'
import { ScholarshipSearchBar } from '@/components/scholarships/ScholarshipSearchBar'
import { ScholarshipFilters, type SearchFilters } from '@/components/scholarships/ScholarshipFilters'
import { SortDropdown, type SortOption } from '@/components/scholarships/SortDropdown'
import { ScholarshipSearchResults } from '@/components/scholarships/ScholarshipSearchResults'
import { EmptySearchState } from '@/components/scholarships/EmptySearchState'

const RESULTS_PER_PAGE = 20

/**
 * Scholarship Search Page Component
 *
 * Syncs all filter/sort state with URL query params for shareable links.
 * Debounced search reduces API calls.
 */
export default function ScholarshipSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn } = useAuth()

  // Parse initial state from URL
  const initialQuery = searchParams?.get('q') || ''
  const initialSort = (searchParams?.get('sort') as SortOption) || (isSignedIn ? 'match' : 'amount')
  const initialPage = parseInt(searchParams?.get('page') || '0', 10)

  // Parse filters from URL
  const initialFilters: SearchFilters = {
    minAward: searchParams?.get('minAward')
      ? parseInt(searchParams.get('minAward')!, 10)
      : undefined,
    maxAward: searchParams?.get('maxAward')
      ? parseInt(searchParams.get('maxAward')!, 10)
      : undefined,
    minMatchScore: searchParams?.get('minMatchScore')
      ? parseInt(searchParams.get('minMatchScore')!, 10)
      : undefined,
    effortLevel: (searchParams?.get('effortLevel') as SearchFilters['effortLevel']) || undefined,
    priorityTier: searchParams?.get('priorityTier')
      ? (searchParams.get('priorityTier')!.split(',') as SearchFilters['priorityTier'])
      : undefined,
  }

  // Local state
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [page, setPage] = useState(initialPage)

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (query) params.set('q', query)
    if (sort !== 'match') params.set('sort', sort)
    if (page > 0) params.set('page', page.toString())
    if (filters.minAward) params.set('minAward', filters.minAward.toString())
    if (filters.maxAward) params.set('maxAward', filters.maxAward.toString())
    if (filters.minMatchScore) params.set('minMatchScore', filters.minMatchScore.toString())
    if (filters.effortLevel) params.set('effortLevel', filters.effortLevel)
    if (filters.priorityTier?.length) params.set('priorityTier', filters.priorityTier.join(','))

    router.replace(`/scholarships/search?${params.toString()}`, { scroll: false })
  }, [query, filters, sort, page, router])

  // Search query
  const { data, isLoading, error, refetch } = trpc.scholarship.search.useQuery(
    {
      query: query || undefined,
      filters,
      sort,
      limit: RESULTS_PER_PAGE,
      offset: page * RESULTS_PER_PAGE,
    },
    {
      enabled: true, // Always fetch, even without query (browse mode)
    }
  )

  // Handlers
  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery)
    setPage(0) // Reset to first page on new search
  }, [])

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    setPage(0) // Reset to first page on filter change
  }, [])

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort)
    setPage(0) // Reset to first page on sort change
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setPage(0)
  }, [])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // Determine empty state variant
  const hasSearchOrFilters = query || Object.keys(filters).length > 0
  const emptyStateVariant = error
    ? 'error'
    : !hasSearchOrFilters
    ? 'initial'
    : 'no-results'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Page title */}
          <h1 className="text-3xl font-bold">Search Scholarships</h1>
          <p className="mt-2 text-muted-foreground">
            Explore {data?.total.toLocaleString() || '10,000+'} scholarships with natural language
            search and advanced filters
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters sidebar (desktop) */}
          <aside className="hidden w-full lg:block lg:w-64 lg:shrink-0">
            <div className="sticky top-8">
              <ScholarshipFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isAuthenticated={isSignedIn}
              />
            </div>
          </aside>

          {/* Main content area */}
          <main className="flex-1">
            {/* Search controls */}
            <div className="mb-6 space-y-4">
              {/* Search bar */}
              <ScholarshipSearchBar onSearch={handleSearch} defaultValue={query} />

              {/* Sort dropdown + filters button (mobile) */}
              <div className="flex items-center gap-4">
                <SortDropdown
                  value={sort}
                  onChange={handleSortChange}
                  isAuthenticated={isSignedIn}
                />

                {/* Mobile filters button */}
                <Button variant="outline" className="lg:hidden">
                  Filters
                </Button>
              </div>
            </div>

            {/* Results or empty state */}
            {data && data.scholarships.length > 0 ? (
              <ScholarshipSearchResults
                scholarships={data.scholarships}
                total={data.total}
                page={page}
                limit={RESULTS_PER_PAGE}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            ) : (
              <EmptySearchState
                variant={emptyStateVariant}
                onClearFilters={handleClearFilters}
                onRetry={handleRetry}
                errorMessage={error?.message}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
