/**
 * ChecklistItem Component
 *
 * Individual checklist item with three-state visual indicator:
 * - NOT_STARTED: Empty circle (○)
 * - IN_PROGRESS: Half-filled circle (◐)
 * - COMPLETE: Checkmark (✓)
 *
 * @module components/applications/ChecklistItem
 */

import React from 'react'
import { Circle, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ChecklistItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

interface ChecklistItemProps {
  /**
   * Item title/name
   */
  title: string

  /**
   * Item status
   */
  status: ChecklistItemStatus

  /**
   * Optional metadata (e.g., word count, file size)
   */
  metadata?: string

  /**
   * Click handler
   */
  onClick?: () => void

  /**
   * Whether item is clickable
   * @default true
   */
  clickable?: boolean

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Get status icon component
 */
function getStatusIcon(status: ChecklistItemStatus) {
  switch (status) {
    case 'COMPLETE':
      return (
        <CheckCircle2
          className="h-5 w-5 text-green-600 dark:text-green-400"
          aria-label="Complete"
        />
      )
    case 'IN_PROGRESS':
      return (
        <Clock
          className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
          aria-label="In progress"
        />
      )
    case 'NOT_STARTED':
    default:
      return (
        <Circle
          className="h-5 w-5 text-gray-400 dark:text-gray-500"
          aria-label="Not started"
        />
      )
  }
}

/**
 * Get status text for screen readers
 */
function getStatusText(status: ChecklistItemStatus): string {
  switch (status) {
    case 'COMPLETE':
      return 'Complete'
    case 'IN_PROGRESS':
      return 'In progress'
    case 'NOT_STARTED':
    default:
      return 'Not started'
  }
}

export function ChecklistItem({
  title,
  status,
  metadata,
  onClick,
  clickable = true,
  className,
}: ChecklistItemProps) {
  const isClickable = clickable && onClick

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md p-3 transition-colors',
        isClickable &&
          'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500',
        !isClickable && 'opacity-60',
        className
      )}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${title}, status: ${getStatusText(status)}${
        metadata ? `, ${metadata}` : ''
      }${isClickable ? ', click to edit' : ''}`}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 pt-0.5" aria-hidden="true">
        {getStatusIcon(status)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          {/* Title */}
          <span
            className={cn(
              'text-sm font-medium',
              status === 'COMPLETE' && 'text-gray-700 dark:text-gray-300',
              status === 'IN_PROGRESS' && 'text-gray-900 dark:text-gray-100',
              status === 'NOT_STARTED' && 'text-gray-600 dark:text-gray-400'
            )}
          >
            {title}
          </span>

          {/* Metadata */}
          {metadata && (
            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {metadata}
            </span>
          )}
        </div>

        {/* Hover hint for clickable items */}
        {isClickable && (
          <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to {status === 'COMPLETE' ? 'view' : 'edit'}
          </span>
        )}
      </div>
    </div>
  )
}
