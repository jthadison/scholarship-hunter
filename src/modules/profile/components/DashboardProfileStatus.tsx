'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

interface DashboardProfileStatusProps {
  /**
   * Callback when action button is clicked
   */
  onActionClick?: () => void
}

/**
 * Story 1.6: Dashboard Profile Status Display
 * Shows at-a-glance profile status on dashboard
 */
export function DashboardProfileStatus({ onActionClick }: DashboardProfileStatusProps) {
  const router = useRouter()
  const { data: completeness, isLoading } = api.profile.getCompleteness.useQuery()
  const { data: readiness } = api.profile.checkReadiness.useQuery()
  const { data: missingFields } = api.profile.getMissingFields.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Loading profile status...</div>
        </CardContent>
      </Card>
    )
  }

  if (!completeness) {
    return null
  }

  const percentage = completeness.completionPercentage
  const isReady = readiness?.isReady ?? false

  // Get color based on completion
  const getColor = () => {
    if (percentage <= 50) return 'text-red-600'
    if (percentage <= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressColor = () => {
    if (percentage <= 50) return 'bg-red-600'
    if (percentage <= 75) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  // Get top 3 missing critical fields
  const topMissing = missingFields?.filter((f) => f.isRequired).slice(0, 3) || []

  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick()
    } else {
      router.push('/profile/edit')
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Header with Status Badge */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold">Profile Status</h3>
            <div className="flex items-center gap-2">
              {isReady ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-600">
                    Profile Ready
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <Badge variant="destructive">Profile Incomplete</Badge>
                </>
              )}
            </div>
          </div>

          {/* Completion Percentage Badge */}
          <div className="text-center">
            <div className={`text-3xl font-bold ${getColor()}`}>{percentage}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress
          value={percentage}
          className="h-2"
          indicatorClassName={getProgressColor()}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Required Fields</div>
            <div className="font-medium">
              {completeness.requiredFieldsComplete}/{completeness.requiredFieldsTotal} complete
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Recommended Fields</div>
            <div className="font-medium">
              {completeness.optionalFieldsComplete}/{completeness.optionalFieldsTotal} complete
            </div>
          </div>
        </div>

        {/* Top Missing Critical Fields */}
        {topMissing.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Quick Wins</span>
            </div>
            <div className="space-y-1">
              {topMissing.map((field) => (
                <div
                  key={field.field}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-orange-600">•</span>
                  <span>
                    Add {field.label} ({field.estimatedImpact})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleActionClick}
          variant={isReady ? 'outline' : 'default'}
          className="w-full"
        >
          {isReady ? 'Edit Profile' : 'Complete Profile'}
        </Button>

        {/* Progress Trend (if available) */}
        {/* TODO: Implement trend tracking in future story */}
      </CardContent>
    </Card>
  )
}
