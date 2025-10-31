/**
 * GapAnalysisDashboard Component
 *
 * Main dashboard displaying gap analysis results:
 * - Header with current profile strength
 * - Impact summary
 * - Gaps grouped by achievability (EASY/MODERATE/LONG_TERM)
 * - Profile projection (before/after)
 * - Run Analysis button
 *
 * Story: 5.3 - Gap Analysis (AC #1, #2, #3, #7)
 * @module components/gap-analysis/GapAnalysisDashboard
 */

'use client'

import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GapCard } from './GapCard'
import { ImpactSummary } from './ImpactSummary'
import { ProfileProjection } from './ProfileProjection'
import {
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react'
import type { Gap } from '@/lib/gap-analysis/types'

export function GapAnalysisDashboard() {
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = trpc.gapAnalysis.analyze.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Analyzing your profile and finding opportunities...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load gap analysis. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  // No data
  if (!analysis) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No gap analysis data available.</AlertDescription>
      </Alert>
    )
  }

  const { gaps, impactSummary, projection } = analysis

  // No gaps found (student already qualifies for top scholarships)
  if (gaps.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-900 mb-1">
                  Excellent Profile Strength!
                </h2>
                <p className="text-green-700">
                  Congratulations! Your profile already qualifies for top-tier scholarships. Keep
                  up the great work and continue applying to opportunities that match your
                  qualifications.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-run Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group gaps by achievability
  const easyGaps = gaps.filter((g: Gap) => g.achievability === 'EASY')
  const moderateGaps = gaps.filter((g: Gap) => g.achievability === 'MODERATE')
  const longTermGaps = gaps.filter((g: Gap) => g.achievability === 'LONG_TERM')

  return (
    <div className="space-y-6">
      {/* Header with Profile Strength */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Profile Gap Analysis
              </h1>
              <p className="text-gray-600">
                Discover what you need to improve to unlock more scholarship opportunities
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run Analysis
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Current Profile Strength:</span>
            <span className="text-2xl font-bold text-blue-600">{projection.current}</span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <ImpactSummary impactSummary={impactSummary} />

      {/* Profile Projection */}
      <ProfileProjection projection={projection} />

      {/* Gaps Grouped by Achievability */}
      <div className="space-y-6">
        {/* Easy Gaps (Quick Wins) */}
        {easyGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Quick Wins ({easyGaps.length})
              </h2>
              <span className="text-sm text-gray-500">• 1-3 months to achieve</span>
            </div>
            <p className="text-sm text-gray-600">
              Start here! These gaps are easiest to close and will give you quick progress.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {easyGaps.map((gap: Gap, idx: number) => (
                <GapCard key={`${gap.category}-${gap.requirement}-${idx}`} gap={gap} />
              ))}
            </div>
          </div>
        )}

        {/* Moderate Gaps */}
        {moderateGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Moderate Improvements ({moderateGaps.length})
              </h2>
              <span className="text-sm text-gray-500">• 3-6 months to achieve</span>
            </div>
            <p className="text-sm text-gray-600">
              Tackle these next. They require sustained effort but offer significant impact.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {moderateGaps.map((gap: Gap, idx: number) => (
                <GapCard key={`${gap.category}-${gap.requirement}-${idx}`} gap={gap} />
              ))}
            </div>
          </div>
        )}

        {/* Long-term Gaps */}
        {longTermGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Long-term Goals ({longTermGaps.length})
              </h2>
              <span className="text-sm text-gray-500">• 6-12+ months to achieve</span>
            </div>
            <p className="text-sm text-gray-600">
              These require long-term commitment. Focus on 1-2 at a time alongside easier goals.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {longTermGaps.map((gap: Gap, idx: number) => (
                <GapCard key={`${gap.category}-${gap.requirement}-${idx}`} gap={gap} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Timestamp */}
      <div className="text-center text-sm text-gray-500">
        Analysis run on {new Date(analysis.analyzedAt).toLocaleString()}
      </div>
    </div>
  )
}
