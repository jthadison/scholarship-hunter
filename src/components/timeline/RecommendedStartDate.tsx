/**
 * Recommended Start Date Component (Story 3.5 - Task 6)
 *
 * Displays recommended start dates for applications with urgency indicators:
 * - ON_TRACK (green): Start date is in the future
 * - START_NOW (yellow): Start date is today
 * - LATE (red): Start date has passed
 *
 * @see docs/stories/epic-3/story-3.5.md
 */

'use client'

import { format, differenceInDays, isPast, isToday } from 'date-fns'
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

/**
 * Urgency level
 */
type UrgencyLevel = 'ON_TRACK' | 'START_NOW' | 'LATE'

/**
 * Recommended Start Date Props
 */
interface RecommendedStartDateProps {
  startDate: Date | null
  deadline: Date
  essayCount: number
  recommendationCount: number
  estimatedHours: number | null
  applicationId: string
  className?: string
}

/**
 * Calculate urgency level
 */
function calculateUrgencyLevel(startDate: Date | null): UrgencyLevel {
  if (!startDate) return 'START_NOW'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  if (isPast(start) && !isToday(start)) {
    return 'LATE'
  }

  if (isToday(start)) {
    return 'START_NOW'
  }

  return 'ON_TRACK'
}

/**
 * Get urgency icon
 */
function getUrgencyIcon(urgency: UrgencyLevel) {
  switch (urgency) {
    case 'ON_TRACK':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'START_NOW':
      return <Zap className="h-4 w-4 text-yellow-600" />
    case 'LATE':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
  }
}

/**
 * Get urgency badge variant
 */
function getUrgencyBadgeVariant(urgency: UrgencyLevel): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (urgency) {
    case 'ON_TRACK':
      return 'default'
    case 'START_NOW':
      return 'secondary'
    case 'LATE':
      return 'destructive'
  }
}

/**
 * Get urgency message
 */
function getUrgencyMessage(urgency: UrgencyLevel, startDate: Date | null, daysLate: number): string {
  switch (urgency) {
    case 'ON_TRACK':
      if (!startDate) return 'Start soon to stay on schedule'
      return `Start by ${format(startDate, 'MMM d')} to stay on schedule`
    case 'START_NOW':
      return 'Recommended start date is today'
    case 'LATE':
      return `You're ${Math.abs(daysLate)} ${Math.abs(daysLate) === 1 ? 'day' : 'days'} behind - start immediately`
  }
}

/**
 * Get urgency badge text
 */
function getUrgencyBadgeText(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'ON_TRACK':
      return 'On Track'
    case 'START_NOW':
      return 'Start Now'
    case 'LATE':
      return 'Late Start'
  }
}

/**
 * Recommended Start Date Component
 *
 * Displays recommended start date with urgency indicator, justification tooltip,
 * and quick-action button to navigate to application workspace.
 *
 * @example
 * ```tsx
 * <RecommendedStartDate
 *   startDate={new Date('2025-11-15')}
 *   deadline={new Date('2025-12-15')}
 *   essayCount={2}
 *   recommendationCount={1}
 *   estimatedHours={10}
 *   applicationId="app-123"
 * />
 * ```
 */
export function RecommendedStartDate({
  startDate,
  deadline,
  essayCount,
  recommendationCount,
  estimatedHours,
  applicationId,
  className,
}: RecommendedStartDateProps) {
  const router = useRouter()
  const urgency = calculateUrgencyLevel(startDate)
  const daysLate = startDate ? differenceInDays(new Date(), startDate) : 0

  const message = getUrgencyMessage(urgency, startDate, daysLate)
  const icon = getUrgencyIcon(urgency)
  const badgeVariant = getUrgencyBadgeVariant(urgency)
  const badgeText = getUrgencyBadgeText(urgency)

  // Build justification text
  const complexity = essayCount + (recommendationCount * 2)
  const justification = `Based on ${essayCount} ${essayCount === 1 ? 'essay' : 'essays'}, ${recommendationCount} ${recommendationCount === 1 ? 'recommendation' : 'recommendations'}, and ${format(deadline, 'MMM d, yyyy')} deadline. Complexity: ${complexity} points.`

  const handleStartNow = () => {
    router.push(`/applications/${applicationId}`)
  }

  return (
    <div className={`flex items-center justify-between gap-2 rounded-md border p-3 ${className || ''}`}>
      <div className="flex flex-1 items-center gap-2">
        {icon}
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="mt-0.5 text-xs text-muted-foreground hover:text-foreground">
                  Why this date?
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{justification}</p>
                {estimatedHours && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimated effort: {estimatedHours}h total
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={badgeVariant}>{badgeText}</Badge>
        {(urgency === 'START_NOW' || urgency === 'LATE') && (
          <Button size="sm" onClick={handleStartNow}>
            Start Now
          </Button>
        )}
      </div>
    </div>
  )
}
