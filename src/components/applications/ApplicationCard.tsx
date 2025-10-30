/**
 * ApplicationCard Component (Enhanced for Story 3.3)
 *
 * Displays a scholarship application in card format with:
 * - Scholarship name and provider
 * - Award amount
 * - Deadline and days remaining
 * - Status badge
 * - Progress indicators (essays, documents, recommendations)
 * - At-risk visual indicator
 * - Drag-and-drop support (desktop only)
 *
 * @component
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, DollarSign, Clock, Building2, AlertTriangle, FileText, Upload, Users, Trophy, XCircle, HelpCircle } from 'lucide-react'
import { formatDaysUntilDeadline, calculateDaysUntilDeadline } from '@/lib/utils/timeline'
import { cn } from '@/lib/utils'
import { isAtRisk, getStatusText, getStatusColor } from '@/lib/utils/application'
import type { Application, Scholarship, Outcome } from '@prisma/client'
import Link from 'next/link'
import { forwardRef } from 'react'
import { useSelectionStore } from '@/stores/useSelectionStore'

interface ApplicationCardProps {
  application: Application & {
    scholarship: Pick<
      Scholarship,
      'name' | 'provider' | 'awardAmount' | 'deadline' | 'category' | 'tags'
    >
    outcome?: Pick<Outcome, 'id' | 'result' | 'awardAmountReceived'> | null // Story 5.1
  }
  isDraggable?: boolean
  className?: string
  style?: React.CSSProperties
  showCheckbox?: boolean // Story 3.9: Enable bulk selection mode
}

/**
 * Progress Indicator Component
 */
function ProgressIndicator({
  icon: Icon,
  completed,
  total,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  completed: number
  total: number
  label: string
}) {
  const isComplete = completed === total && total > 0

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        className={cn(
          'h-4 w-4',
          isComplete ? 'text-green-600' : 'text-gray-400'
        )}
      />
      <span className={cn('text-xs', isComplete ? 'text-green-600 font-medium' : 'text-gray-600')}>
        {completed}/{total} {label}
      </span>
    </div>
  )
}

export const ApplicationCard = forwardRef<HTMLDivElement, ApplicationCardProps>(
  ({ application, isDraggable = false, className, style, showCheckbox = false }, ref) => {
    const { scholarship, outcome } = application
    const daysUntilDeadline = calculateDaysUntilDeadline(scholarship.deadline)
    const daysText = formatDaysUntilDeadline(scholarship.deadline)
    const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0
    const atRisk = isAtRisk(application)

    // Story 3.9: Selection state
    const { isSelected, toggleSelection } = useSelectionStore()
    const selected = isSelected(application.id)

    const handleCheckboxChange = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleSelection(application.id)
    }

    // Story 5.1: Outcome-based visual distinction
    const hasOutcome = !!outcome
    const isAwarded = outcome?.result === 'AWARDED'
    const isDenied = outcome?.result === 'DENIED'
    const isWithdrawn = outcome?.result === 'WITHDRAWN'

    return (
      <div className="relative">
        {/* Story 3.9: Selection checkbox overlay */}
        {showCheckbox && (
          <div
            className="absolute top-3 left-3 z-10"
            onClick={handleCheckboxChange}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => toggleSelection(application.id)}
              aria-label={`Select application: ${scholarship.name}`}
              data-testid={`app-checkbox-${application.id}`}
            />
          </div>
        )}

        <Link href={`/applications/${application.id}`} className="block">
          <Card
            ref={ref}
            className={cn(
              'hover:shadow-lg transition-shadow cursor-pointer',
              atRisk && !hasOutcome && 'border-red-400 border-2', // Story 5.1: At-risk only if no outcome
              selected && 'border-blue-500 border-2 bg-blue-50', // Story 3.9: Visual indicator for selection
              isAwarded && 'border-green-400 border-2 bg-green-50/30', // Story 5.1: Green border for awarded
              isDenied && 'border-red-300 border bg-red-50/20', // Story 5.1: Red border for denied
              isWithdrawn && 'border-gray-300 border bg-gray-50/30', // Story 5.1: Gray border for withdrawn
              isDraggable && 'cursor-grab active:cursor-grabbing',
              className
            )}
            style={style}
          >
            <CardContent className={cn('p-6', showCheckbox && 'pl-12')}>
            {/* At-Risk Indicator */}
            {atRisk && !hasOutcome && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">At Risk - Needs Attention</span>
              </div>
            )}

            {/* Story 5.1: Outcome Badge (displayed prominently if outcome exists) */}
            {hasOutcome && outcome && (
              <div className={cn(
                "flex items-center gap-2 mb-3 px-3 py-2 rounded-md font-medium",
                isAwarded && "bg-green-100 border border-green-300",
                isDenied && "bg-red-100 border border-red-300",
                outcome.result === 'WAITLISTED' && "bg-yellow-100 border border-yellow-300",
                isWithdrawn && "bg-gray-100 border border-gray-300"
              )}>
                {isAwarded && <Trophy className="h-4 w-4 text-green-700" />}
                {isDenied && <XCircle className="h-4 w-4 text-red-700" />}
                {outcome.result === 'WAITLISTED' && <HelpCircle className="h-4 w-4 text-yellow-700" />}
                {isWithdrawn && <AlertTriangle className="h-4 w-4 text-gray-700" />}
                <span className={cn(
                  "text-sm",
                  isAwarded && "text-green-800",
                  isDenied && "text-red-800",
                  outcome.result === 'WAITLISTED' && "text-yellow-800",
                  isWithdrawn && "text-gray-800"
                )}>
                  {outcome.result === 'AWARDED' && 'Awarded'}
                  {outcome.result === 'DENIED' && 'Denied'}
                  {outcome.result === 'WAITLISTED' && 'Waitlisted'}
                  {outcome.result === 'WITHDRAWN' && 'Withdrawn'}
                  {isAwarded && outcome.awardAmountReceived && `: $${outcome.awardAmountReceived.toLocaleString()}`}
                </span>
              </div>
            )}

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

          {/* Progress Indicators (Story 3.3 AC2) */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <ProgressIndicator
              icon={FileText}
              completed={application.essayComplete}
              total={application.essayCount}
              label="Essays"
            />
            <ProgressIndicator
              icon={Upload}
              completed={application.documentsUploaded}
              total={application.documentsRequired}
              label="Docs"
            />
            <ProgressIndicator
              icon={Users}
              completed={application.recsReceived}
              total={application.recsRequired}
              label="Recs"
            />
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
      </div>
  )
}
)

ApplicationCard.displayName = 'ApplicationCard'
