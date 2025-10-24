'use client'

import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileProgressIndicatorProps {
  completionPercentage: number
  requiredFieldsComplete: number
  requiredFieldsTotal: number
  optionalFieldsComplete: number
  optionalFieldsTotal: number
  missingRequired: string[]
  missingRecommended: string[]
  className?: string
}

export function ProfileProgressIndicator({
  completionPercentage,
  requiredFieldsComplete,
  requiredFieldsTotal,
  optionalFieldsComplete,
  optionalFieldsTotal,
  missingRequired,
  missingRecommended,
  className,
}: ProfileProgressIndicatorProps) {
  // Determine text color based on completion percentage
  const getProgressTextColor = () => {
    if (completionPercentage >= 75) return 'text-green-600'
    if (completionPercentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profile Completeness</h3>
        <span
          className={cn('text-2xl font-bold', getProgressTextColor())}
        >
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={completionPercentage} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Required: {requiredFieldsComplete}/{requiredFieldsTotal}
          </span>
          <span>
            Optional: {optionalFieldsComplete}/{optionalFieldsTotal}
          </span>
        </div>
      </div>

      {/* Missing Required Fields */}
      {missingRequired.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-red-900 dark:text-red-100">
                Required Fields Missing
              </p>
              <p className="text-sm text-red-800 dark:text-red-200">
                Please complete these required fields to improve your
                scholarship matching:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-0.5 mt-2">
                {missingRequired.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Missing Recommended Fields */}
      {missingRecommended.length > 0 && missingRequired.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Recommended Fields
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Adding these optional fields will help improve your scholarship
                matching:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-0.5 mt-2">
                {missingRecommended.slice(0, 5).map((field) => (
                  <li key={field}>{field}</li>
                ))}
                {missingRecommended.length > 5 && (
                  <li className="text-xs italic">
                    +{missingRecommended.length - 5} more fields
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Completion Success Message */}
      {completionPercentage === 100 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-green-900 dark:text-green-100">
                Profile Complete!
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Your profile is 100% complete. You're ready to discover
                scholarships matched to your unique profile!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completion Level Indicators */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div
          className={cn(
            'py-2 px-3 rounded-md',
            completionPercentage < 50
              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          &lt;50% - Basic
        </div>
        <div
          className={cn(
            'py-2 px-3 rounded-md',
            completionPercentage >= 50 && completionPercentage < 75
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          50-75% - Good
        </div>
        <div
          className={cn(
            'py-2 px-3 rounded-md',
            completionPercentage >= 75
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          75%+ - Excellent
        </div>
      </div>
    </div>
  )
}
