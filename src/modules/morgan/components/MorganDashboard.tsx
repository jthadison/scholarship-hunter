/**
 * Morgan Dashboard - Main Container Component
 *
 * Displays comprehensive essay writing overview with:
 * - Greeting with Morgan persona
 * - Essays in progress with workflow guidance
 * - Essay library overview
 * - Reusability suggestions
 * - Quality alerts
 * - Writing progress stats
 *
 * @component
 * Story 4.10: Morgan Agent - Essay Strategist Dashboard (Task 2, All ACs)
 */

'use client'

import { trpc } from '@/shared/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { MorganHeader } from './MorganHeader'
import { WritingProgressStats } from './WritingProgressStats'
import { EssayWorkflowList } from './EssayWorkflowList'
import { ReusabilitySuggestions } from './ReusabilitySuggestions'
import { QualityAlerts } from './QualityAlerts'
import { EssayLibraryOverview } from './EssayLibraryOverview'

interface MorganDashboardProps {
  firstName: string
}

export function MorganDashboard({ firstName }: MorganDashboardProps) {
  // Get student ID from session
  const { data: sessionData, isLoading: studentLoading } = trpc.auth.getSession.useQuery()
  const studentId = sessionData?.student?.id ?? ''

  // Fetch essay summary
  const {
    data: essaySummary,
    isLoading: summaryLoading,
    error: summaryError,
  } = trpc.morgan.getEssaySummary.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000, // 30 seconds
    }
  )

  // Fetch reusability suggestions
  const {
    data: reusabilitySuggestions,
    isLoading: reusabilityLoading,
    error: reusabilityError,
  } = trpc.morgan.getReusabilitySuggestions.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Fetch quality alerts
  const {
    data: qualityAlerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = trpc.morgan.getQualityAlerts.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Loading state
  if (studentLoading || summaryLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  // Error state
  if (summaryError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load essay data: {summaryError.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No student profile
  if (!studentId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete your student profile to access Morgan's dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* AC2, AC7: Morgan persona header with personalized greeting */}
      <MorganHeader firstName={firstName} />

      {/* AC6: Writing progress stats */}
      <WritingProgressStats
        weeklyDrafts={essaySummary?.stats.weeklyDrafts ?? 0}
        librarySize={essaySummary?.stats.librarySize ?? 0}
        avgQualityScore={essaySummary?.stats.avgQualityScore ?? 0}
      />

      {/* AC5: Quality alerts (low-scoring essays) */}
      {qualityAlerts && qualityAlerts.length > 0 && (
        <QualityAlerts alerts={qualityAlerts} isLoading={alertsLoading} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AC1, AC3: In-progress essays with workflow guidance */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Essays in Progress</h2>
          {essaySummary && (
            <EssayWorkflowList essays={essaySummary.inProgress} />
          )}
        </div>

        {/* AC1: Essay library overview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Essay Library</h2>
          {essaySummary && (
            <EssayLibraryOverview essays={essaySummary.completed} />
          )}
        </div>
      </div>

      {/* AC4: Reusability suggestions */}
      {reusabilitySuggestions && reusabilitySuggestions.length > 0 && (
        <ReusabilitySuggestions
          suggestions={reusabilitySuggestions}
          isLoading={reusabilityLoading}
        />
      )}
    </div>
  )
}
