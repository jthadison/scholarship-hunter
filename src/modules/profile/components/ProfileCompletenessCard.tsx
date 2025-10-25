'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trpc } from '@/shared/lib/trpc'

interface ProfileCompletenessCardProps {
  /**
   * Optional callback when "Complete Profile" button is clicked
   */
  onCompleteProfile?: () => void
}

/**
 * Story 1.6: Profile Completeness Display Component
 * Shows completion percentage, progress bar, and categorized missing fields
 */
export function ProfileCompletenessCard({ onCompleteProfile }: ProfileCompletenessCardProps) {
  const { data: completeness, isLoading } = trpc.profile.getCompleteness.useQuery()
  const { data: missingFields } = trpc.profile.getMissingFields.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Completeness</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!completeness) {
    return null
  }

  const percentage = completeness.completionPercentage

  // Color scheme: 0-50% red, 51-75% yellow, 76-100% green
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

  const getMessage = () => {
    if (percentage < 50) {
      return 'Keep going! Complete your profile to unlock scholarship matches'
    }
    if (percentage <= 75) {
      return "You're halfway there! Add a few more details for better matches"
    }
    if (percentage < 96) {
      return 'Almost done! Finish your profile for maximum matching accuracy'
    }
    return 'Profile complete! You\'re ready for scholarship matching ✓'
  }

  // Calculate estimated time to complete
  const missingCount = (completeness.missingRequired.length + completeness.missingRecommended.length)
  const estimatedMinutes = Math.ceil(missingCount * 0.5) // Assume 30 seconds per field

  // Group missing fields by category
  const categorizedMissing = missingFields?.reduce((acc: Record<string, typeof missingFields>, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category]?.push(field)
    return acc
  }, {} as Record<string, typeof missingFields>) || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Completeness</CardTitle>
        <CardDescription>
          Track your profile progress and see what's missing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completion Percentage with Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-4xl font-bold ${getColor()}`}>
              {percentage}%
            </span>
            <span className="text-sm text-muted-foreground">
              {percentage === 100 ? 'Complete' : `${100 - percentage}% to go`}
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-3"
            indicatorClassName={getProgressColor()}
          />
        </div>

        {/* Required vs. Optional Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Required Fields</div>
            <div className="flex items-center gap-2">
              {completeness.missingRequired.length === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {completeness.requiredFieldsComplete}/{completeness.requiredFieldsTotal} complete
                  </span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-600">
                    {completeness.requiredFieldsComplete}/{completeness.requiredFieldsTotal} complete
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Recommended Fields</div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                {completeness.optionalFieldsComplete}/{completeness.optionalFieldsTotal} complete
              </span>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{getMessage()}</AlertDescription>
        </Alert>

        {/* Estimated Time to Complete */}
        {percentage < 100 && (
          <div className="text-sm text-muted-foreground text-center">
            ~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''} to reach 100% completion
          </div>
        )}

        {/* Categorized Missing Fields Checklist */}
        {percentage < 100 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">What's Missing</h3>
            {Object.entries(categorizedMissing).map(([category, fields]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {(fields as any[]).length} field{(fields as any[]).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1 pl-4">
                  {(fields as any[]).slice(0, 3).map((field: any) => (
                    <div key={field.field} className="flex items-start gap-2 text-sm">
                      <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {field.label}
                          {field.isRequired && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {field.prompt} ({field.estimatedImpact})
                        </div>
                      </div>
                    </div>
                  ))}
                  {(fields as any[]).length > 3 && (
                    <div className="text-xs text-muted-foreground pl-6">
                      +{(fields as any[]).length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Complete Profile Button */}
        {percentage < 100 && onCompleteProfile && (
          <Button onClick={onCompleteProfile} className="w-full">
            Complete Profile
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
