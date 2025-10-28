/**
 * Capacity Suggestions Component (Story 3.6 - Task 5)
 *
 * Proactively suggests high-priority applications to start when student has
 * available capacity (<10 hours/week).
 *
 * Acceptance Criteria #4:
 * Proactive capacity suggestions: "✨ You have capacity this week (only 6 hours scheduled).
 * Consider starting [Scholarship Name]" to optimize throughput
 *
 * @component
 */

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Sparkles, TrendingUp, DollarSign, Calendar, ChevronRight } from 'lucide-react'
import { differenceInDays } from 'date-fns'

type PriorityTier = 'MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH'

interface SuggestedApplication {
  applicationId: string
  scholarshipName: string
  awardAmount: number
  deadline: Date
  priorityTier: PriorityTier | null
  matchScore?: number
  estimatedHours?: number
}

interface CapacitySuggestionsProps {
  hasCapacity: boolean
  currentWeeklyHours: number
  suggestedApplication: SuggestedApplication | null
  onStartApplication?: (applicationId: string) => void
  onDismiss?: () => void
}

/**
 * Get priority tier badge styling
 */
function getTierBadge(tier: PriorityTier | null) {
  const badges = {
    MUST_APPLY: {
      label: 'MUST APPLY',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    SHOULD_APPLY: {
      label: 'SHOULD APPLY',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    IF_TIME_PERMITS: {
      label: 'IF TIME PERMITS',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    HIGH_VALUE_REACH: {
      label: 'HIGH VALUE REACH',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
  }
  return tier ? badges[tier] : { label: 'UNRANKED', className: 'bg-gray-100 text-gray-800 border-gray-300' }
}

export function CapacitySuggestions({
  hasCapacity,
  currentWeeklyHours,
  suggestedApplication,
  onStartApplication,
  onDismiss,
}: CapacitySuggestionsProps) {
  // No capacity - don't show anything
  if (!hasCapacity) {
    return null
  }

  // Has capacity but no suggestions (backlog empty)
  if (!suggestedApplication) {
    return (
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            You're Ahead of Schedule!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Sparkles className="h-12 w-12 text-cyan-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              ✨ Great work! You have capacity this week.
            </p>
            <p className="text-sm text-gray-600">
              Only {currentWeeklyHours} hours scheduled. All your applications are in progress or complete!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tierBadge = getTierBadge(suggestedApplication.priorityTier)
  const daysUntilDeadline = differenceInDays(suggestedApplication.deadline, new Date())

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-600" />
          You Have Capacity This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity Message */}
        <div className="bg-white rounded-lg p-4 border border-cyan-100">
          <p className="text-sm text-gray-700 mb-1">
            ✨ You have capacity this week (only{' '}
            <span className="font-bold text-cyan-700">{currentWeeklyHours} hours</span> scheduled)
          </p>
          <p className="text-xs text-gray-600">
            Maximize your throughput by starting another application!
          </p>
        </div>

        {/* Suggested Application */}
        <div className="bg-white rounded-lg p-4 border-2 border-cyan-200 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-900 mb-1">
                {suggestedApplication.scholarshipName}
              </h4>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${tierBadge.className}`}>
                {tierBadge.label}
              </div>
            </div>
            {suggestedApplication.matchScore && (
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-700">
                  {suggestedApplication.matchScore}
                </div>
                <div className="text-xs text-gray-500">Match</div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-semibold text-gray-900">
                  ${suggestedApplication.awardAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Award Amount</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <div className="font-semibold text-gray-900">
                  {daysUntilDeadline} days
                </div>
                <div className="text-xs text-gray-500">Until Deadline</div>
              </div>
            </div>
          </div>

          {/* Estimated Work */}
          {suggestedApplication.estimatedHours && (
            <div className="bg-cyan-50 rounded px-3 py-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-cyan-600" />
                <span className="text-gray-700">
                  Estimated: <span className="font-semibold">{suggestedApplication.estimatedHours} hours</span>
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onStartApplication && (
              <Button
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                onClick={() => onStartApplication(suggestedApplication.applicationId)}
              >
                Start This Application
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Not now
              </Button>
            )}
          </div>
        </div>

        {/* Why This One */}
        <div className="text-xs text-gray-600 bg-white rounded p-3 border border-cyan-100">
          <p className="font-semibold mb-1">💡 Why we're suggesting this:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            {suggestedApplication.priorityTier === 'MUST_APPLY' && (
              <li>Highest priority tier (MUST APPLY)</li>
            )}
            {suggestedApplication.matchScore && suggestedApplication.matchScore >= 85 && (
              <li>Excellent match score ({suggestedApplication.matchScore})</li>
            )}
            <li>Deadline in {daysUntilDeadline} days - good timing to start</li>
            <li>Award amount: ${suggestedApplication.awardAmount.toLocaleString()}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
