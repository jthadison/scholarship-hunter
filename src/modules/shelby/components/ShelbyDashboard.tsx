'use client'

/**
 * Shelby Dashboard - Main Container Component
 *
 * Displays personalized scholarship opportunities with:
 * - Greeting with student name and match count
 * - Quick stats (total matches, potential funding, highest score)
 * - Top 5 MUST_APPLY scholarships
 * - Action prompts for deadlines and exploration
 *
 * @component
 */

import { trpc } from '@/shared/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ShelbyHeader } from './ShelbyHeader'
import { StatCard } from './StatCard'
import { ScholarshipMatchCard } from './ScholarshipMatchCard'
import { ActionPrompts } from './ActionPrompts'
import { Trophy, DollarSign, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ShelbyDashboardProps {
  firstName: string
}

export function ShelbyDashboard({ firstName }: ShelbyDashboardProps) {
  const { toast } = useToast()
  const utils = trpc.useUtils()

  // Get student ID from session
  const { data: sessionData, isLoading: studentLoading } = trpc.auth.getSession.useQuery()
  const studentId = sessionData?.student?.id ?? ''

  // Debug logging
  console.log('[ShelbyDashboard] Component mounted')
  console.log('[ShelbyDashboard] studentLoading:', studentLoading)
  console.log('[ShelbyDashboard] sessionData:', sessionData)
  console.log('[ShelbyDashboard] studentId:', studentId)

  // Matching mutation
  const recalculateMatches = trpc.matching.recalculateMatches.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Matches Calculated!',
        description: data.message,
      })
      // Invalidate all matching queries to refetch fresh data
      utils.matching.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Matching Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleFindMatches = () => {
    if (!studentId) {
      toast({
        title: 'Error',
        description: 'Student ID not found. Please try refreshing the page.',
        variant: 'destructive',
      })
      return
    }
    recalculateMatches.mutate({ studentId })
  }

  // Fetch top matches (try MUST_APPLY first, fall back to SHOULD_APPLY)
  const {
    data: mustApplyData,
    isLoading: mustApplyLoading,
    error: matchesError,
  } = trpc.matching.getMatchesByTier.useQuery(
    {
      studentId,
      tier: 'MUST_APPLY',
      limit: 5,
    },
    {
      enabled: !!studentId,
      staleTime: 30000, // 30 seconds
    }
  )

  const {
    data: shouldApplyData,
    isLoading: shouldApplyLoading,
  } = trpc.matching.getMatchesByTier.useQuery(
    {
      studentId,
      tier: 'SHOULD_APPLY',
      limit: 5,
    },
    {
      enabled: !!studentId && (!mustApplyData || mustApplyData.matches.length === 0),
      staleTime: 30000,
    }
  )

  const matchesLoading = mustApplyLoading || shouldApplyLoading
  const topMatchesData = mustApplyData?.matches.length ? mustApplyData : shouldApplyData
  const displayTier = mustApplyData?.matches.length ? 'MUST_APPLY' : 'SHOULD_APPLY'

  // Fetch match statistics for quick stats
  const { data: statsData, isLoading: statsLoading } = trpc.matching.getMatchStats.useQuery(
    {
      studentId,
    },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Fetch tier counts for action prompts
  const { data: tierCounts } = trpc.matching.getTierCounts.useQuery(
    {
      studentId,
    },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Calculate total potential funding from all matches
  const { data: allMatchesData } = trpc.matching.getMatches.useQuery(
    {
      studentId,
      limit: 100,
    },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  const totalPotentialFunding =
    allMatchesData?.matches.reduce((sum, match) => sum + match.scholarship.awardAmount, 0) ?? 0

  const isLoading = studentLoading || matchesLoading || statsLoading
  const topMatches = topMatchesData?.matches ?? []
  const totalMatches = statsData?.totalMatches ?? 0
  const highestScore = statsData?.topMatches?.[0]?.overallMatchScore ?? 0

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (matchesError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load scholarship matches. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with greeting and avatar */}
      <ShelbyHeader firstName={firstName} totalMatches={totalMatches} />

      {/* Quick stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Matched Scholarships"
          value={totalMatches}
          icon={<Trophy className="h-6 w-6" />}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200"
        />
        <StatCard
          label="Total Potential Funding"
          value={`$${totalPotentialFunding.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
        />
        <StatCard
          label="Highest Match Score"
          value={highestScore}
          icon={<Star className="h-6 w-6" />}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
        />
      </div>

      {/* Action Prompts */}
      {topMatches.length > 0 && tierCounts && (
        <ActionPrompts matches={topMatches} tierCounts={tierCounts} />
      )}

      {/* Top Scholarships */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Top Opportunities</h2>
            {topMatches.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing top {displayTier === 'MUST_APPLY' ? 'MUST APPLY' : 'SHOULD APPLY'} matches
              </p>
            )}
          </div>
          <Button
            onClick={handleFindMatches}
            disabled={recalculateMatches.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMatches.isPending ? 'animate-spin' : ''}`} />
            {recalculateMatches.isPending ? 'Finding Matches...' : 'Find Matches'}
          </Button>
        </div>

        {topMatches.length === 0 ? (
          <Alert>
            <AlertDescription>
              No scholarship matches yet! Click "Find Matches" to discover opportunities.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {topMatches.map((match) => (
              <ScholarshipMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
