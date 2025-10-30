/**
 * Essay Library Page (Story 4.8)
 *
 * Displays completed essays with theme tagging, search, filtering, and adaptability scoring
 * AC1: Library displays all completed essays with sort/filter options
 * AC8: Search functionality
 * AC10: Library statistics
 *
 * @module app/dashboard/essays/library
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Filter, X } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { EssayCard } from '@/components/essay/library/EssayCard'
import { LibraryStats } from '@/components/essay/library/LibraryStats'
import { LibraryFilters } from '@/components/essay/library/LibraryFilters'
import { EssayPreviewModal } from '@/components/essay/library/EssayPreviewModal'

/**
 * Essay Library Page Component
 * Displays searchable, filterable library of completed essays
 */
export default function EssayLibraryPage() {
  const searchParams = useSearchParams()
  const newPromptContext = searchParams?.get('newPromptContext') // For adaptability mode

  // Get student ID from session
  const { data: sessionData } = trpc.auth.getSession.useQuery()
  const studentId = sessionData?.student?.id ?? ''

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'quality' | 'adaptable' | 'alphabetical'>('recent')
  const [filterThemes, setFilterThemes] = useState<string[]>([])
  const [wordCountRange, setWordCountRange] = useState<[number | undefined, number | undefined]>([undefined, undefined])
  const [showFilters, setShowFilters] = useState(false)
  const [previewEssayId, setPreviewEssayId] = useState<string | null>(null)

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch library essays
  const {
    data: essays,
    isLoading: loadingEssays,
    refetch: refetchEssays,
  } = trpc.essay.getLibrary.useQuery({
    studentId,
    sortBy,
    filterThemes: filterThemes.length > 0 ? filterThemes : undefined,
    wordCountMin: wordCountRange[0],
    wordCountMax: wordCountRange[1],
    searchTerm: debouncedSearchTerm || undefined,
  }, {
    enabled: !!studentId,
  })

  // Fetch library statistics
  const { data: stats, isLoading: loadingStats } = trpc.essay.getLibraryStats.useQuery({
    studentId,
  }, {
    enabled: !!studentId,
  })

  // Adaptability scores (if in new prompt context)
  const { data: adaptabilityScores } = trpc.essay.getAdaptabilityScores.useQuery(
    {
      studentId,
      newPrompt: newPromptContext || '',
      newPromptThemes: [], // TODO: Extract from prompt
      newPromptWordLimit: 750, // TODO: Get from prompt requirements
    },
    {
      enabled: !!newPromptContext && !!studentId,
    }
  )

  // Create score lookup map
  const scoreMap = useMemo(() => {
    if (!adaptabilityScores) return new Map()
    return new Map(adaptabilityScores.map(s => [s.essayId, s.score]))
  }, [adaptabilityScores])

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterThemes([])
    setWordCountRange([undefined, undefined])
    setSortBy('recent')
  }

  const hasActiveFilters =
    searchTerm || filterThemes.length > 0 || wordCountRange[0] !== undefined || wordCountRange[1] !== undefined

  if (!studentId || loadingEssays || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading essay library...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div role="banner">
        <h1 className="text-3xl font-bold tracking-tight">Essay Library</h1>
        <p className="text-muted-foreground">
          Manage and reuse your completed essays strategically
        </p>
      </div>

      {/* Library Statistics */}
      {stats && <LibraryStats stats={stats} />}

      {/* Search and Filter Bar */}
      <Card role="search" aria-label="Essay search and filters">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search essays by title, content, or themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search essays"
                type="search"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              aria-expanded={showFilters}
            >
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
                  Active
                </span>
              )}
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
                Clear All
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <LibraryFilters
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterThemes={filterThemes}
                setFilterThemes={setFilterThemes}
                wordCountRange={wordCountRange}
                setWordCountRange={setWordCountRange}
                availableThemes={stats?.themeCount ? Object.keys(stats.themeCount) : []}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {(!essays || essays.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'No essays found matching your filters.'
                : "You haven't completed any essays yet."}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Finish your first essay to start building your library!'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={() => window.location.href = '/dashboard/essays/new'}>
                Create Your First Essay
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Essay Grid */}
      {essays && essays.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Essay library">
          {essays.map((essay) => (
            <EssayCard
              key={essay.id}
              essay={essay}
              adaptabilityScore={scoreMap.get(essay.id)}
              showAdaptabilityBadge={!!newPromptContext}
              onPreview={() => setPreviewEssayId(essay.id)}
              onRefetch={refetchEssays}
            />
          ))}
        </div>
      )}

      {/* Essay Preview Modal */}
      {previewEssayId && (
        <EssayPreviewModal
          essayId={previewEssayId}
          isOpen={!!previewEssayId}
          onClose={() => setPreviewEssayId(null)}
          onRefetch={refetchEssays}
        />
      )}
    </div>
  )
}
