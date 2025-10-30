/**
 * Quality Alerts Component
 *
 * Displays low-quality essay alerts:
 * - Essay title and quality score
 * - Critical issues list
 * - "Review & Improve" action button
 * - Urgency indicators (yellow for <60, red for <40)
 *
 * @component
 * Story 4.10: AC5 - Quality alerts
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingDown, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { EssayPhase } from '@prisma/client'

interface QualityAlertsProps {
  alerts: Array<{
    essay: {
      id: string
      title: string
      phase: EssayPhase
      wordCount: number
    }
    qualityScore: number
    scholarshipName: string | null
    deadline: Date | null
    applicationId: string | null
    criticalIssues: string[]
    topSuggestions: Array<{
      priority: string
      issue: string
      recommendation: string
    }>
  }>
  isLoading: boolean
}

export function QualityAlerts({ alerts, isLoading }: QualityAlertsProps) {
  if (isLoading) {
    return (
      <Card className="border-orange-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-300 bg-orange-50/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900">
              Quality Improvement Needed
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {alerts.length} {alerts.length === 1 ? 'essay' : 'essays'} need your attention before submission
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          // Determine urgency based on quality score
          const urgency =
            alert.qualityScore < 40
              ? { level: 'critical', color: 'red', icon: AlertCircle }
              : { level: 'warning', color: 'yellow', icon: AlertTriangle }

          const UrgencyIcon = urgency.icon

          return (
            <Card
              key={alert.essay.id}
              className={`border-${urgency.color}-300 bg-white hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Quality score with urgency indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className={`bg-${urgency.color}-100 border-2 border-${urgency.color}-400 rounded-lg p-3 text-center`}
                    >
                      <div className={`text-2xl font-bold text-${urgency.color}-700`}>
                        {alert.qualityScore}
                      </div>
                      <div className="text-xs text-gray-600">/ 100</div>
                      <div className={`mt-1 flex items-center justify-center text-${urgency.color}-600`}>
                        <UrgencyIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Alert details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {alert.essay.title}
                      </h4>
                      {alert.scholarshipName && (
                        <p className="text-sm text-gray-600">
                          for <span className="font-medium">{alert.scholarshipName}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={urgency.level === 'critical' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {urgency.level === 'critical' ? 'Urgent' : 'Needs Work'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {alert.essay.phase}
                        </Badge>
                      </div>
                    </div>

                    {/* Critical issues */}
                    <div className={`bg-${urgency.color}-50 border border-${urgency.color}-200 rounded p-3`}>
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Critical Issues:
                      </p>
                      <ul className="space-y-1">
                        {alert.criticalIssues.map((issue, index) => (
                          <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Top suggestions preview */}
                    {alert.topSuggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs font-semibold text-blue-900 mb-2">
                          Quick Win: {alert.topSuggestions[0].issue}
                        </p>
                        <p className="text-xs text-blue-800">
                          {alert.topSuggestions[0].recommendation}
                        </p>
                      </div>
                    )}

                    {/* Action button */}
                    <Button
                      asChild
                      className={`w-full bg-${urgency.color}-600 hover:bg-${urgency.color}-700 text-white`}
                      size="sm"
                    >
                      <Link href={`/dashboard/essays/${alert.essay.id}`}>
                        Review & Improve
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Encouragement message */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-900 font-medium">
            💪 Don't worry! Every great essay needs revision. Let's work together to make these shine!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
