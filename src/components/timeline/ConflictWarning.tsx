/**
 * Conflict Warning Component (Story 3.5 - Task 3)
 *
 * Displays warnings when multiple applications have overlapping work periods
 * exceeding the 15-hour per week sustainable threshold.
 *
 * @see docs/stories/epic-3/story-3.5.md
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

/**
 * Weekly conflict data
 */
interface WeeklyConflict {
  weekStart: Date
  weekNumber: number
  year: number
  totalHours: number
  applicationIds: string[]
  applicationNames: string[]
  warningMessage: string
}

/**
 * Conflict Warning Props
 */
interface ConflictWarningProps {
  conflicts: WeeklyConflict[]
}

/**
 * Conflict Warning Component
 *
 * Displays collapsible warning banner for timeline conflicts with:
 * - Warning count badge
 * - List of conflicted weeks
 * - Affected applications per week
 * - Total hours per week
 *
 * @example
 * ```tsx
 * <ConflictWarning
 *   conflicts={[
 *     {
 *       weekStart: new Date('2025-11-01'),
 *       weekNumber: 44,
 *       year: 2025,
 *       totalHours: 18,
 *       applicationIds: ['1', '2', '3'],
 *       applicationNames: ['STEM Scholarship', 'Leadership Award', 'Community Service'],
 *       warningMessage: 'Warning: Nov 1-7 has 18 hours scheduled...'
 *     }
 *   ]}
 * />
 * ```
 */
export function ConflictWarning({ conflicts }: ConflictWarningProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (conflicts.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          Schedule Conflicts Detected
          <Badge variant="destructive">{conflicts.length} {conflicts.length === 1 ? 'week' : 'weeks'}</Badge>
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mb-2 p-0 hover:bg-transparent">
              {isOpen ? 'Hide details' : 'Show details'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div key={`${conflict.year}-${conflict.weekNumber}`} className="rounded-md border border-orange-200 bg-white p-3 dark:border-orange-800 dark:bg-orange-950/10">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {conflict.warningMessage}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <span className="font-semibold">Total workload:</span> {conflict.totalHours} hours
                      {conflict.totalHours > 20 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Very High
                        </Badge>
                      )}
                      {conflict.totalHours > 15 && conflict.totalHours <= 20 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          High
                        </Badge>
                      )}
                    </p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-orange-700 hover:text-orange-900 dark:text-orange-300 dark:hover:text-orange-100">
                        Affected applications ({conflict.applicationIds.length})
                      </summary>
                      <ul className="ml-4 mt-1 list-disc space-y-0.5 text-orange-800 dark:text-orange-200">
                        {conflict.applicationNames.map((name, appIdx) => (
                          <li key={appIdx}>{name}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <div className="mt-2 rounded-md bg-orange-100 p-2 dark:bg-orange-900/30">
                    <p className="text-xs text-orange-900 dark:text-orange-100">
                      <strong>Recommendation:</strong> Consider deferring IF_TIME_PERMITS applications
                      to the following week, or start high-priority applications earlier to distribute workload.
                    </p>
                  </div>
                </div>
              ))}
              <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                <p className="font-semibold">About Conflict Detection</p>
                <p className="mt-1 text-xs">
                  Conflicts are detected when multiple applications have overlapping work periods
                  totaling more than 15 hours per week. This threshold is based on research showing
                  students can sustain 10-15 hours/week on extracurricular activities without burnout.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  )
}
