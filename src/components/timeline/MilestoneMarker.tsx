/**
 * Milestone Marker Component (Story 3.5 - Task 5)
 *
 * Displays individual milestone markers in the calendar with:
 * - Icon based on milestone type
 * - Color based on priority tier
 * - Hover tooltip with details
 *
 * @see docs/stories/epic-3/story-3.5.md
 */

'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PriorityTier } from '@prisma/client'

/**
 * Milestone type
 */
type MilestoneType = 'start_essay' | 'request_recs' | 'upload_docs' | 'final_review' | 'submit'

/**
 * Milestone data
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
 * Get icon for milestone type
 */
function getMilestoneIcon(type: MilestoneType): string {
  switch (type) {
    case 'start_essay':
      return '✍️'
    case 'request_recs':
      return '📧'
    case 'upload_docs':
      return '📄'
    case 'final_review':
      return '🔍'
    case 'submit':
      return '✅'
  }
}

/**
 * Get label for milestone type
 */
function getMilestoneLabel(type: MilestoneType): string {
  switch (type) {
    case 'start_essay':
      return 'Start Essay'
    case 'request_recs':
      return 'Request Recommendations'
    case 'upload_docs':
      return 'Upload Documents'
    case 'final_review':
      return 'Final Review'
    case 'submit':
      return 'Submit Application'
  }
}

/**
 * Get color variant based on priority tier
 */
function getPriorityColor(priorityTier: PriorityTier | null): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (priorityTier) {
    case 'MUST_APPLY':
      return 'default' // green (primary)
    case 'SHOULD_APPLY':
      return 'secondary' // blue
    case 'IF_TIME_PERMITS':
      return 'outline' // yellow
    case 'HIGH_VALUE_REACH':
      return 'destructive' // orange/red
    default:
      return 'secondary'
  }
}

/**
 * Get background color class based on priority tier
 */
function getPriorityBgClass(priorityTier: PriorityTier | null): string {
  switch (priorityTier) {
    case 'MUST_APPLY':
      return 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30'
    case 'SHOULD_APPLY':
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
    case 'IF_TIME_PERMITS':
      return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
    case 'HIGH_VALUE_REACH':
      return 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30'
    default:
      return 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
  }
}

/**
 * Milestone Marker Component Props
 */
interface MilestoneMarkerProps {
  milestone: Milestone
}

/**
 * Milestone Marker Component
 *
 * Displays a milestone with icon, color coding, and tooltip.
 * Clicking navigates to the application workspace.
 *
 * @example
 * ```tsx
 * <MilestoneMarker
 *   milestone={{
 *     date: new Date(),
 *     type: 'start_essay',
 *     applicationId: '123',
 *     scholarshipName: 'STEM Scholarship',
 *     priorityTier: 'MUST_APPLY',
 *     estimatedHours: 10
 *   }}
 * />
 * ```
 */
export function MilestoneMarker({ milestone }: MilestoneMarkerProps) {
  const router = useRouter()

  const icon = getMilestoneIcon(milestone.type)
  const label = getMilestoneLabel(milestone.type)
  const bgClass = getPriorityBgClass(milestone.priorityTier)

  const handleClick = () => {
    router.push(`/applications/${milestone.applicationId}`)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-xs transition-colors ${bgClass}`}
          >
            <span className="flex-shrink-0">{icon}</span>
            <span className="truncate font-medium">{milestone.scholarshipName}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{milestone.scholarshipName}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {milestone.estimatedHours && (
              <p className="text-xs text-muted-foreground">
                Estimated: {milestone.estimatedHours}h total
              </p>
            )}
            {milestone.priorityTier && (
              <Badge variant={getPriorityColor(milestone.priorityTier)} className="text-xs">
                {milestone.priorityTier.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
