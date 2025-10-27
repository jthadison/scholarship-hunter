/**
 * ColumnHeader Component (Story 3.3)
 *
 * Displays a Kanban column header with:
 * - Column title
 * - Count badge showing number of applications in column
 *
 * @component
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ColumnStatus } from '@/lib/utils/application'

interface ColumnHeaderProps {
  status: ColumnStatus
  count: number
  className?: string
}

/**
 * Get column title from status
 */
function getColumnTitle(status: ColumnStatus): string {
  switch (status) {
    case 'BACKLOG':
      return 'Backlog'
    case 'TODO':
      return 'To Do'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'SUBMITTED':
      return 'Submitted'
    default:
      return status
  }
}

/**
 * Get column badge variant based on status
 */
function getBadgeVariant(status: ColumnStatus): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'BACKLOG':
      return 'outline'
    case 'TODO':
      return 'default'
    case 'IN_PROGRESS':
      return 'secondary'
    case 'SUBMITTED':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Get column badge color classes
 */
function getBadgeColor(status: ColumnStatus): string {
  switch (status) {
    case 'BACKLOG':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    case 'TODO':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    case 'SUBMITTED':
      return 'bg-green-100 text-green-700 hover:bg-green-200'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
}

export function ColumnHeader({ status, count, className }: ColumnHeaderProps) {
  const title = getColumnTitle(status)

  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
      <Badge
        variant={getBadgeVariant(status)}
        className={cn('ml-2 font-medium', getBadgeColor(status), count === 0 && 'opacity-50')}
      >
        {count}
      </Badge>
    </div>
  )
}
