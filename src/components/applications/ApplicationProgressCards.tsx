/**
 * ApplicationProgressCards Component
 *
 * Dashboard aggregated progress view showing multiple applications with:
 * - Circular progress indicators
 * - Color-coded progress rings (red/yellow/green)
 * - Quick action buttons
 * - Sorting options
 *
 * @module components/applications/ApplicationProgressCards
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, DollarSign } from 'lucide-react'
import { CircularProgress } from '../ui/ProgressBar'
import { cn } from '@/lib/utils'
import { differenceInDays, format } from 'date-fns'

interface ApplicationProgressCardsProps {
  /**
   * Applications with progress data
   */
  applications: Array<{
    id: string
    progressPercentage: number
    status: string
    scholarship: {
      name: string
      awardAmount: number | null
      deadline: Date
    }
    timeline: {
      submitDate: Date | null
    } | null
  }>

  /**
   * Additional CSS classes
   */
  className?: string
}

export function ApplicationProgressCards({
  applications,
  className,
}: ApplicationProgressCardsProps) {
  const router = useRouter()

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No applications in progress. Browse scholarships to get started.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {applications.map((application) => {
        const daysUntilDeadline = differenceInDays(
          new Date(application.scholarship.deadline),
          new Date()
        )

        const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0

        return (
          <div
            key={application.id}
            className={cn(
              'group relative rounded-lg border p-4 transition-all hover:shadow-md',
              isUrgent
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            )}
          >
            {/* Progress circle */}
            <div className="flex items-start gap-4">
              <CircularProgress
                percentage={application.progressPercentage}
                size="md"
              />

              {/* Card content */}
              <div className="flex-1 min-w-0">
                {/* Scholarship name */}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                  {application.scholarship.name}
                </h3>

                {/* Award amount */}
                {application.scholarship.awardAmount && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-3 w-3" />
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(application.scholarship.awardAmount)}
                    </span>
                  </div>
                )}

                {/* Deadline */}
                <div
                  className={cn(
                    'mt-1 flex items-center gap-1 text-xs',
                    isUrgent
                      ? 'font-semibold text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  <span>
                    {daysUntilDeadline > 0
                      ? `${daysUntilDeadline} days left`
                      : daysUntilDeadline === 0
                      ? 'Due today'
                      : 'Overdue'}
                  </span>
                </div>

                {/* Formatted deadline */}
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(application.scholarship.deadline), 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => router.push(`/applications/${application.id}`)}
                className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Continue Application
              </button>
              <button
                onClick={() => router.push(`/applications/${application.id}`)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                View Details
              </button>
            </div>

            {/* Urgent indicator */}
            {isUrgent && (
              <div className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                Urgent
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
