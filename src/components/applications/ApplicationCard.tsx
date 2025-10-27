/**
 * ApplicationCard Component
 *
 * Displays a scholarship application in card format with:
 * - Scholarship name and provider
 * - Award amount
 * - Deadline and days remaining
 * - Status badge
 * - Progress indicators
 *
 * @component
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Clock, Building2 } from 'lucide-react'
import { formatDaysUntilDeadline, calculateDaysUntilDeadline } from '@/lib/utils/timeline'
import { cn } from '@/lib/utils'
import type { Application, Scholarship } from '@prisma/client'
import Link from 'next/link'

interface ApplicationCardProps {
  application: Application & {
    scholarship: Pick<
      Scholarship,
      'name' | 'provider' | 'awardAmount' | 'deadline' | 'category' | 'tags'
    >
  }
}

/**
 * Get status badge color based on application status
 */
function getStatusColor(
  status: Application['status']
): 'blue' | 'yellow' | 'purple' | 'green' | 'gray' {
  switch (status) {
    case 'NOT_STARTED':
    case 'TODO':
      return 'blue'
    case 'IN_PROGRESS':
      return 'yellow'
    case 'READY_FOR_REVIEW':
      return 'purple'
    case 'SUBMITTED':
    case 'AWAITING_DECISION':
      return 'green'
    case 'AWARDED':
      return 'green'
    case 'DENIED':
    case 'WITHDRAWN':
      return 'gray'
    default:
      return 'blue'
  }
}

/**
 * Get status display text
 */
function getStatusText(status: Application['status']): string {
  switch (status) {
    case 'NOT_STARTED':
      return 'Not Started'
    case 'TODO':
      return 'To Do'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'READY_FOR_REVIEW':
      return 'Ready for Review'
    case 'SUBMITTED':
      return 'Submitted'
    case 'AWAITING_DECISION':
      return 'Awaiting Decision'
    case 'AWARDED':
      return 'Awarded'
    case 'DENIED':
      return 'Denied'
    case 'WITHDRAWN':
      return 'Withdrawn'
    default:
      return status
  }
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { scholarship } = application
  const daysUntilDeadline = calculateDaysUntilDeadline(scholarship.deadline)
  const daysText = formatDaysUntilDeadline(scholarship.deadline)
  const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0

  return (
    <Link href={`/applications/${application.id}`} className="block">
      <Card
        className={cn(
          'hover:shadow-lg transition-shadow cursor-pointer',
          isUrgent && 'border-orange-400 border-2'
        )}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                {scholarship.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{scholarship.provider}</span>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'ml-2',
                getStatusColor(application.status) === 'blue' && 'bg-blue-100 text-blue-700',
                getStatusColor(application.status) === 'yellow' &&
                  'bg-yellow-100 text-yellow-700',
                getStatusColor(application.status) === 'purple' &&
                  'bg-purple-100 text-purple-700',
                getStatusColor(application.status) === 'green' && 'bg-green-100 text-green-700',
                getStatusColor(application.status) === 'gray' && 'bg-gray-100 text-gray-700'
              )}
            >
              {getStatusText(application.status)}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Award Amount */}
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                ${scholarship.awardAmount.toLocaleString()}
              </span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="truncate">
                {new Date(scholarship.deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Days Remaining */}
            <div className="flex items-center gap-2">
              <Clock
                className={cn(
                  'h-4 w-4',
                  isUrgent ? 'text-orange-600' : 'text-gray-600'
                )}
              />
              <span
                className={cn(
                  'font-medium',
                  isUrgent ? 'text-orange-600' : 'text-gray-700'
                )}
              >
                {daysText}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${application.progressPercentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {Math.round(application.progressPercentage)}%
              </span>
            </div>
          </div>

          {/* Priority Tier */}
          {application.priorityTier && (
            <div className="mt-4 pt-4 border-t">
              <Badge
                variant="outline"
                className={cn(
                  application.priorityTier === 'MUST_APPLY' &&
                    'border-red-300 text-red-700 bg-red-50',
                  application.priorityTier === 'SHOULD_APPLY' &&
                    'border-yellow-300 text-yellow-700 bg-yellow-50',
                  application.priorityTier === 'IF_TIME_PERMITS' &&
                    'border-blue-300 text-blue-700 bg-blue-50',
                  application.priorityTier === 'HIGH_VALUE_REACH' &&
                    'border-purple-300 text-purple-700 bg-purple-50'
                )}
              >
                {application.priorityTier.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
