/**
 * DeadlineCountdown Component
 *
 * Real-time countdown timer with urgency color coding and motivational messages.
 * Updates every minute to show time remaining until deadline.
 *
 * Story 3.8 AC#5: Deadline countdown timer
 *
 * @module components/workspace/DeadlineCountdown
 */

'use client'

import React from 'react'
import { Clock, AlertCircle, AlertTriangle } from 'lucide-react'
import { useDeadlineCountdown, UrgencyLevel } from '@/hooks/useDeadlineCountdown'
import { cn } from '@/lib/utils'

interface DeadlineCountdownProps {
  /**
   * Deadline date
   */
  deadline: Date | null | undefined

  /**
   * Current progress percentage (for motivational message)
   */
  progressPercentage?: number

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Show motivational message
   */
  showMessage?: boolean
}

const urgencyConfig: Record<
  UrgencyLevel,
  {
    color: string
    bgColor: string
    borderColor: string
    icon: typeof Clock
  }
> = {
  safe: {
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: Clock,
  },
  warning: {
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: Clock,
  },
  urgent: {
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: AlertCircle,
  },
  critical: {
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
  },
}

export function DeadlineCountdown({
  deadline,
  progressPercentage = 0,
  className,
  showMessage = false,
}: DeadlineCountdownProps) {
  const countdown = useDeadlineCountdown(deadline, progressPercentage)

  if (!countdown || !deadline) {
    return null
  }

  const config = urgencyConfig[countdown.urgencyLevel]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0', config.color)} aria-hidden="true" />
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', config.color)}>
            {countdown.isPast ? 'Deadline Passed' : 'Time Remaining'}
          </p>
          <p className={cn('mt-1 text-lg font-bold', config.color)}>{countdown.displayText}</p>
          {showMessage && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {countdown.motivationalMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
