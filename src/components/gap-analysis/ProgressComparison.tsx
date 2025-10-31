/**
 * ProgressComparison Component
 *
 * Shows improvement over time since last gap analysis:
 * - Profile strength change
 * - Gaps closed
 * - New scholarships unlocked
 * - Highlights closed gaps with celebration
 *
 * Story: 5.3 - Gap Analysis (AC #5)
 * @module components/gap-analysis/ProgressComparison
 */

'use client'

import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

export function ProgressComparison() {
  const { data: comparison, isLoading } = trpc.gapAnalysis.compareToHistory.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-gray-500">
            <Clock className="h-5 w-5 mr-2 animate-pulse" />
            Loading progress data...
          </div>
        </CardContent>
      </Card>
    )
  }

  // No previous analysis
  if (!comparison) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No previous gap analysis found. Run the analysis above, then update your profile and
          re-run to track your progress over time.
        </AlertDescription>
      </Alert>
    )
  }

  const {
    lastAnalysisDate,
    daysSince,
    profileStrengthChange,
    gapsClosed,
    newScholarshipsUnlocked,
  } = comparison

  const hasImprovement =
    profileStrengthChange > 0 || gapsClosed > 0 || newScholarshipsUnlocked > 0
  const hasDecline = profileStrengthChange < 0

  const lastAnalysisDateStr = new Date(lastAnalysisDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className={hasImprovement ? 'border-green-200 bg-green-50/30' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasImprovement && <Sparkles className="h-5 w-5 text-green-600" />}
          {!hasImprovement && !hasDecline && <Clock className="h-5 w-5 text-gray-600" />}
          {hasDecline && <TrendingDown className="h-5 w-5 text-orange-600" />}
          Progress Since Last Analysis
        </CardTitle>
        <p className="text-sm text-gray-600">
          Last analyzed {daysSince} day{daysSince !== 1 ? 's' : ''} ago ({lastAnalysisDateStr})
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Profile Strength Change */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Profile Strength</span>
              {profileStrengthChange !== 0 && (
                <Badge
                  variant="outline"
                  className={
                    profileStrengthChange > 0
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-orange-100 text-orange-700 border-orange-300'
                  }
                >
                  {profileStrengthChange > 0 ? '+' : ''}
                  {profileStrengthChange}
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              {profileStrengthChange > 0 && (
                <TrendingUp className="h-5 w-5 text-green-600" />
              )}
              {profileStrengthChange < 0 && (
                <TrendingDown className="h-5 w-5 text-orange-600" />
              )}
              {profileStrengthChange === 0 && (
                <div className="h-5 w-5 flex items-center justify-center text-gray-400">
                  −
                </div>
              )}
              <span className="text-2xl font-bold text-gray-900">
                {Math.abs(profileStrengthChange)}
              </span>
              <span className="text-sm text-gray-500">point{Math.abs(profileStrengthChange) !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Gaps Closed */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Gaps Closed</span>
              {gapsClosed > 0 && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">{gapsClosed}</span>
              <span className="text-sm text-gray-500">gap{gapsClosed !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* New Scholarships */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">New Scholarships</span>
              {newScholarshipsUnlocked > 0 && (
                <Award className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {newScholarshipsUnlocked}
              </span>
              <span className="text-sm text-gray-500">unlocked</span>
            </div>
          </div>
        </div>

        {/* Celebration Message */}
        {hasImprovement && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 mb-1">Great Progress!</p>
                <p className="text-sm text-green-700">
                  {profileStrengthChange > 0 &&
                    `Your profile strength has increased by ${profileStrengthChange} points. `}
                  {gapsClosed > 0 &&
                    `You've closed ${gapsClosed} gap${gapsClosed !== 1 ? 's' : ''}. `}
                  {newScholarshipsUnlocked > 0 &&
                    `This unlocked ${newScholarshipsUnlocked} new scholarship${
                      newScholarshipsUnlocked !== 1 ? 's' : ''
                    }. `}
                  Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Change Message */}
        {!hasImprovement && !hasDecline && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              No changes detected since last analysis. Update your profile with new achievements,
              then re-run the analysis to track your progress.
            </p>
          </div>
        )}

        {/* Decline Message */}
        {hasDecline && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700">
              Your profile strength has decreased slightly. This may be due to changes in
              scholarship requirements or profile updates. Review your profile and consider
              focusing on the recommended improvements above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
