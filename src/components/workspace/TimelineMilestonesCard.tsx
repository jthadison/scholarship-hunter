/**
 * TimelineMilestonesCard Component
 *
 * Displays application timeline milestones in chronological order
 * with completion status and days until next milestone.
 *
 * Story 3.8 AC#1: Timeline milestones in unified interface
 *
 * @module components/workspace/TimelineMilestonesCard
 */

'use client'

import React from 'react'
import { Calendar, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { format, differenceInDays, isFuture } from 'date-fns'
import { CollapsibleCard } from './CollapsibleCard'
import { cn } from '@/lib/utils'

interface TimelineMilestonesCardProps {
  /**
   * Timeline data
   */
  timeline: {
    startEssayDate: Date | null
    requestRecsDate: Date | null
    uploadDocsDate: Date | null
    finalReviewDate: Date | null
    submitDate: Date | null
    estimatedHours?: number | null
    hasConflicts?: boolean
  } | null

  /**
   * Current application progress (to mark milestones complete)
   */
  progress: {
    essayComplete: number
    essayCount: number
    documentsUploaded: number
    documentsRequired: number
    recsReceived: number
    recsRequired: number
  }

  /**
   * Whether card is expanded
   */
  isExpanded: boolean

  /**
   * Toggle callback
   */
  onToggle: (id: string) => void

  /**
   * Additional CSS classes
   */
  className?: string
}

interface Milestone {
  id: string
  label: string
  date: Date | null
  isComplete: boolean
  isCurrent: boolean
}

/**
 * Build milestone list from timeline data
 */
function buildMilestones(
  timeline: TimelineMilestonesCardProps['timeline'],
  progress: TimelineMilestonesCardProps['progress']
): Milestone[] {
  if (!timeline) return []

  // Define milestones with completion logic
  const milestones: Milestone[] = [
    {
      id: 'start-essay',
      label: 'Start Essay',
      date: timeline.startEssayDate,
      isComplete: progress.essayComplete > 0,
      isCurrent: false,
    },
    {
      id: 'request-recs',
      label: 'Request Recommendations',
      date: timeline.requestRecsDate,
      isComplete: progress.recsReceived >= progress.recsRequired,
      isCurrent: false,
    },
    {
      id: 'upload-docs',
      label: 'Upload Documents',
      date: timeline.uploadDocsDate,
      isComplete: progress.documentsUploaded >= progress.documentsRequired,
      isCurrent: false,
    },
    {
      id: 'final-review',
      label: 'Final Review',
      date: timeline.finalReviewDate,
      isComplete:
        progress.essayComplete >= progress.essayCount &&
        progress.documentsUploaded >= progress.documentsRequired &&
        progress.recsReceived >= progress.recsRequired,
      isCurrent: false,
    },
    {
      id: 'submit',
      label: 'Submit Application',
      date: timeline.submitDate,
      isComplete: false, // Will be marked complete when status is SUBMITTED
      isCurrent: false,
    },
  ].filter((m) => m.date !== null) // Remove milestones without dates

  // Determine current milestone (first incomplete milestone with future date)
  const currentIndex = milestones.findIndex(
    (m) => !m.isComplete && m.date && isFuture(m.date)
  )
  if (currentIndex >= 0) {
    milestones[currentIndex]!.isCurrent = true
  }

  return milestones
}

/**
 * Get milestone status icon
 */
function MilestoneIcon({ isComplete, isCurrent }: { isComplete: boolean; isCurrent: boolean }) {
  if (isComplete) {
    return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
  }
  if (isCurrent) {
    return <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  }
  return <Circle className="h-5 w-5 text-gray-400 dark:text-gray-600" />
}

export function TimelineMilestonesCard({
  timeline,
  progress,
  isExpanded,
  onToggle,
  className,
}: TimelineMilestonesCardProps) {
  const milestones = buildMilestones(timeline, progress)

  // Find next upcoming milestone
  const nextMilestone = milestones.find((m) => !m.isComplete && m.date && isFuture(m.date))
  const daysUntilNext = nextMilestone?.date
    ? differenceInDays(nextMilestone.date, new Date())
    : null

  return (
    <CollapsibleCard
      id="timeline"
      title="Timeline & Milestones"
      subtitle={
        nextMilestone && daysUntilNext !== null
          ? `Next: ${nextMilestone.label} in ${daysUntilNext} ${daysUntilNext === 1 ? 'day' : 'days'}`
          : 'All milestones complete'
      }
      icon={<Calendar className="h-5 w-5" />}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-4">
        {/* Milestones List */}
        {milestones.length > 0 ? (
          <div className="relative space-y-4 pl-6">
            {/* Vertical timeline line */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {milestones.map((milestone) => (
              <div key={milestone.id} className="relative">
                {/* Icon */}
                <div className="absolute -left-[22px] top-1">
                  <MilestoneIcon
                    isComplete={milestone.isComplete}
                    isCurrent={milestone.isCurrent}
                  />
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'rounded-lg border p-3',
                    milestone.isCurrent
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                      : milestone.isComplete
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          milestone.isCurrent
                            ? 'text-blue-900 dark:text-blue-100'
                            : milestone.isComplete
                              ? 'text-green-900 dark:text-green-100'
                              : 'text-gray-900 dark:text-gray-100'
                        )}
                      >
                        {milestone.label}
                      </p>
                      {milestone.date && (
                        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                          {format(milestone.date, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    {milestone.isComplete && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        Complete
                      </span>
                    )}
                    {milestone.isCurrent && (
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No timeline milestones available
          </p>
        )}

        {/* Estimated Hours */}
        {timeline?.estimatedHours && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Total Effort</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {timeline.estimatedHours} hours
            </p>
          </div>
        )}

        {/* Conflict Warning */}
        {timeline?.hasConflicts && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Schedule Conflict Detected
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Stay on schedule! Complete {nextMilestone?.label || 'your next task'} by{' '}
                  {nextMilestone?.date && format(nextMilestone.date, 'MMM d')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}
