/**
 * Timeline Calendar Component (Story 3.5 - Task 5)
 *
 * Displays all application milestones across a calendar view with:
 * - Month/week view toggle
 * - Color-coded priority tiers
 * - Milestone icons (essay, recs, docs, review, submit)
 * - Conflict warnings
 * - Hover tooltips with details
 *
 * @see docs/stories/epic-3/story-3.5.md
 */

'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MilestoneMarker } from './MilestoneMarker'
import { ConflictWarning } from './ConflictWarning'
import type { PriorityTier, ApplicationStatus } from '@prisma/client'

/**
 * Timeline data for calendar display
 */
interface TimelineData {
  applicationId: string
  scholarshipName: string
  awardAmount: number
  deadline: Date
  priorityTier: PriorityTier | null
  status: ApplicationStatus
  timeline: {
    startEssayDate: Date | null
    requestRecsDate: Date | null
    uploadDocsDate: Date | null
    finalReviewDate: Date | null
    submitDate: Date | null
    estimatedHours: number | null
    hasConflicts: boolean
  } | null
}

/**
 * Calendar view mode
 */
type ViewMode = 'month' | 'week'

/**
 * Milestone type
 */
type MilestoneType = 'start_essay' | 'request_recs' | 'upload_docs' | 'final_review' | 'submit'

/**
 * Milestone with metadata
 */
interface Milestone {
  date: Date
  type: MilestoneType
  applicationId: string
  scholarshipName: string
  priorityTier: PriorityTier | null
  estimatedHours: number | null
}

/**
 * Extract milestones from timeline data
 */
function extractMilestones(calendarData: TimelineData[]): Milestone[] {
  const milestones: Milestone[] = []

  for (const app of calendarData) {
    if (!app.timeline) continue

    const { timeline } = app

    if (timeline.startEssayDate) {
      milestones.push({
        date: new Date(timeline.startEssayDate),
        type: 'start_essay',
        applicationId: app.applicationId,
        scholarshipName: app.scholarshipName,
        priorityTier: app.priorityTier,
        estimatedHours: timeline.estimatedHours,
      })
    }

    if (timeline.requestRecsDate) {
      milestones.push({
        date: new Date(timeline.requestRecsDate),
        type: 'request_recs',
        applicationId: app.applicationId,
        scholarshipName: app.scholarshipName,
        priorityTier: app.priorityTier,
        estimatedHours: timeline.estimatedHours,
      })
    }

    if (timeline.uploadDocsDate) {
      milestones.push({
        date: new Date(timeline.uploadDocsDate),
        type: 'upload_docs',
        applicationId: app.applicationId,
        scholarshipName: app.scholarshipName,
        priorityTier: app.priorityTier,
        estimatedHours: timeline.estimatedHours,
      })
    }

    if (timeline.finalReviewDate) {
      milestones.push({
        date: new Date(timeline.finalReviewDate),
        type: 'final_review',
        applicationId: app.applicationId,
        scholarshipName: app.scholarshipName,
        priorityTier: app.priorityTier,
        estimatedHours: timeline.estimatedHours,
      })
    }

    if (timeline.submitDate) {
      milestones.push({
        date: new Date(timeline.submitDate),
        type: 'submit',
        applicationId: app.applicationId,
        scholarshipName: app.scholarshipName,
        priorityTier: app.priorityTier,
        estimatedHours: timeline.estimatedHours,
      })
    }
  }

  return milestones
}

/**
 * Get milestones for a specific day
 */
function getMilestonesForDay(milestones: Milestone[], date: Date): Milestone[] {
  return milestones.filter((m) => isSameDay(m.date, date))
}

/**
 * Timeline Calendar Component
 *
 * @example
 * ```tsx
 * <TimelineCalendar />
 * ```
 */
export function TimelineCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // Fetch calendar data
  const { data: calendarData, isLoading } = trpc.timeline.getCalendarView.useQuery({
    startDate: startOfMonth(currentMonth),
    endDate: endOfMonth(currentMonth),
  })

  // Fetch conflict data
  const { data: conflictData } = trpc.timeline.detectConflicts.useQuery({})

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!calendarData || calendarData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No applications with timelines yet. Add scholarships to your applications to see your timeline.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Extract all milestones
  const milestones = extractMilestones(calendarData)

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Timeline Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              Next
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Conflict warnings */}
        {conflictData && conflictData.hasConflicts && (
          <div className="mb-4">
            <ConflictWarning conflicts={conflictData.conflictedWeeks} />
          </div>
        )}

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dayMilestones = getMilestonesForDay(milestones, day)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-20 rounded-md border p-2 ${
                  isTodayDate ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="mb-1 text-right">
                  <span
                    className={`text-sm ${
                      isTodayDate ? 'font-bold text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Milestones for this day */}
                <div className="space-y-1">
                  {dayMilestones.slice(0, 3).map((milestone, idx) => (
                    <MilestoneMarker
                      key={`${milestone.applicationId}-${milestone.type}-${idx}`}
                      milestone={milestone}
                    />
                  ))}
                  {dayMilestones.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{dayMilestones.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 border-t pt-4">
          <h4 className="mb-2 text-sm font-semibold">Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">✍️</span>
              <span className="text-muted-foreground">Start Essay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📧</span>
              <span className="text-muted-foreground">Request Recs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <span className="text-muted-foreground">Upload Docs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="text-muted-foreground">Final Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="text-muted-foreground">Submit</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
