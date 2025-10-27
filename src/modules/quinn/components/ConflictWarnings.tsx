/**
 * Conflict Warnings Component (Story 3.6 - Task 4)
 *
 * Displays conflict warnings when multiple applications have overlapping work
 * exceeding the 15-hour sustainable threshold. Provides specific actionable
 * recommendations for resolution.
 *
 * Acceptance Criteria #3:
 * Conflict warnings prominently displayed: "⚠️ Warning: 3 applications due same week
 * (Nov 20-27) - consider deferring IF_TIME_PERMITS tier applications" with specific
 * actionable recommendations
 *
 * @component
 */

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

type PriorityTier = 'MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH'

interface ConflictedApplication {
  applicationId: string
  scholarshipName: string
  priorityTier: PriorityTier | null
  estimatedHours: number
}

interface ConflictedWeek {
  weekStart: Date
  weekEnd: Date
  totalHours: number
  applications: ConflictedApplication[]
  warningMessage: string
}

interface ConflictWarningsProps {
  hasConflicts: boolean
  conflictedWeeks: ConflictedWeek[]
  totalConflictedApplications: number
  onDeferApplication?: (applicationId: string) => void
  onViewCalendar?: () => void
}

/**
 * Generate resolution recommendations based on conflicted applications
 */
function getResolutionRecommendations(applications: ConflictedApplication[]): string[] {
  const recommendations: string[] = []

  // Check for IF_TIME_PERMITS tier applications
  const ifTimePermitsApps = applications.filter(
    (app) => app.priorityTier === 'IF_TIME_PERMITS'
  )
  if (ifTimePermitsApps.length > 0) {
    recommendations.push(
      `Defer ${ifTimePermitsApps.map((a) => a.scholarshipName).join(', ')} to next week (IF_TIME_PERMITS tier)`
    )
  }

  // Check for REACH tier applications
  const reachApps = applications.filter((app) => app.priorityTier === 'HIGH_VALUE_REACH')
  if (reachApps.length > 0 && ifTimePermitsApps.length === 0 && reachApps[0]) {
    recommendations.push(
      `Consider deferring ${reachApps[0].scholarshipName} (REACH tier) to reduce workload`
    )
  }

  // If all are MUST_APPLY, suggest working ahead
  const mustApplyApps = applications.filter((app) => app.priorityTier === 'MUST_APPLY')
  if (mustApplyApps.length === applications.length && applications[0]) {
    recommendations.push(
      `All applications are high-priority. Start working ahead this week on ${applications[0].scholarshipName}`
    )
  }

  // Always suggest reviewing timeline
  if (recommendations.length === 0) {
    recommendations.push('Review your timeline to identify tasks that can be started early')
  }

  return recommendations
}

export function ConflictWarnings({
  hasConflicts,
  conflictedWeeks,
  totalConflictedApplications,
  onDeferApplication,
  onViewCalendar,
}: ConflictWarningsProps) {
  if (!hasConflicts || conflictedWeeks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            No Conflicts Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your schedule looks great! No workload conflicts detected. Keep up the excellent
              planning.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Workload Conflicts Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Warning */}
        <Alert variant="destructive" className="bg-orange-50 border-orange-300">
          <AlertTriangle className="h-4 w-4 text-orange-700" />
          <AlertDescription className="text-orange-900">
            ⚠️ Warning: {conflictedWeeks.length}{' '}
            {conflictedWeeks.length === 1 ? 'week has' : 'weeks have'} excessive workload (
            {totalConflictedApplications} applications affected). Consider deferring lower-priority
            applications.
          </AlertDescription>
        </Alert>

        {/* Detailed Conflicts */}
        <div className="space-y-4">
          {conflictedWeeks.map((week, index) => (
            <ConflictWeekCard
              key={index}
              week={week}
              onDeferApplication={onDeferApplication}
            />
          ))}
        </div>

        {/* View Full Calendar CTA */}
        {onViewCalendar && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewCalendar}
            >
              View Full Calendar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Conflicted Week Card
 */
function ConflictWeekCard({
  week,
  onDeferApplication,
}: {
  week: ConflictedWeek
  onDeferApplication?: (applicationId: string) => void
}) {
  const recommendations = getResolutionRecommendations(week.applications)

  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">
      {/* Week Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">
            {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d, yyyy')}
          </h4>
          <p className="text-sm text-orange-700 font-medium">
            {week.totalHours} hours scheduled ({week.applications.length} applications)
          </p>
        </div>
        <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          OVERLOADED
        </div>
      </div>

      {/* Applications in Conflict */}
      <div className="mb-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase">Applications in conflict:</p>
        {week.applications.map((app) => (
          <div
            key={app.applicationId}
            className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
          >
            <div className="flex-1">
              <span className="font-medium text-gray-900">{app.scholarshipName}</span>
              {app.priorityTier && (
                <span className="ml-2 text-xs text-gray-500">
                  ({app.priorityTier.replace(/_/g, ' ')})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">{app.estimatedHours}h</span>
              {onDeferApplication &&
                (app.priorityTier === 'IF_TIME_PERMITS' ||
                  app.priorityTier === 'HIGH_VALUE_REACH') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeferApplication(app.applicationId)}
                  >
                    Defer
                  </Button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg p-3 border border-orange-100">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          💡 Recommendations:
        </p>
        <ul className="space-y-1.5">
          {recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 text-cyan-600 flex-shrink-0" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
