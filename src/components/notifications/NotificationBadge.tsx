/**
 * Story 3.4: Notification Badge Component
 *
 * Displays alert count badge in header with urgency-based styling
 *
 * @module components/notifications/NotificationBadge
 */

'use client'

import { Bell } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { trpc } from '@/shared/lib/trpc'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  onClick?: () => void
  className?: string
}

/**
 * Calculate max urgency level from alerts
 */
function getMaxUrgencyColor(alerts: any[]): string {
  if (!alerts || alerts.length === 0) return 'bg-blue-500'

  // Check for CRITICAL alerts (1 day or day-of)
  const hasCritical = alerts.some(
    (a) => a.alertType === 'DEADLINE_1D' || a.alertType === 'DEADLINE_TODAY'
  )
  if (hasCritical) return 'bg-red-500'

  // Check for URGENT alerts (3 days)
  const hasUrgent = alerts.some((a) => a.alertType === 'DEADLINE_3D')
  if (hasUrgent) return 'bg-orange-500'

  // Check for WARNING alerts (7 days)
  const hasWarning = alerts.some((a) => a.alertType === 'DEADLINE_7D')
  if (hasWarning) return 'bg-yellow-500'

  // Default to INFO (14-30 days)
  return 'bg-blue-500'
}

export function NotificationBadge({
  onClick,
  className,
}: NotificationBadgeProps) {
  const { data: alerts, isLoading } = trpc.alert.getUnread.useQuery(
    undefined,
    {
      refetchInterval: 60000, // Poll every 60 seconds
    }
  )

  const count = alerts?.length ?? 0
  const urgencyColor = getMaxUrgencyColor(alerts ?? [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={onClick}
      aria-label={`${count} unread notifications`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <Badge
          className={cn(
            'absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs font-bold text-white',
            urgencyColor
          )}
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
      {isLoading && (
        <span className="absolute right-0 top-0 h-2 w-2 animate-pulse rounded-full bg-blue-400" />
      )}
    </Button>
  )
}
