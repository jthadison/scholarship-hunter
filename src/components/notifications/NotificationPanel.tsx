/**
 * Story 3.4: Notification Panel Component
 *
 * Dropdown panel showing all active alerts with urgency indicators
 * Supports snooze and dismiss actions
 *
 * @module components/notifications/NotificationPanel
 */

'use client'

import { AlertCircle, AlertTriangle, Flame, Info, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { trpc } from '@/shared/lib/trpc'
import { cn } from '@/lib/utils'
import { differenceInDays, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import type { AlertType } from '@prisma/client'

/**
 * Get urgency level from alert type
 */
function getUrgencyLevel(
  alertType: AlertType
): 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL' {
  switch (alertType) {
    case 'DEADLINE_30D':
    case 'DEADLINE_14D':
      return 'INFO'
    case 'DEADLINE_7D':
      return 'WARNING'
    case 'DEADLINE_3D':
      return 'URGENT'
    case 'DEADLINE_1D':
    case 'DEADLINE_TODAY':
      return 'CRITICAL'
  }
}

/**
 * Get urgency styling config
 */
function getUrgencyConfig(urgencyLevel: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL') {
  const configs = {
    INFO: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    WARNING: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    URGENT: {
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    CRITICAL: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  }

  return configs[urgencyLevel]
}

interface NotificationPanelProps {
  children: React.ReactNode
}

export function NotificationPanel({ children }: NotificationPanelProps) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const { data: alerts, isLoading } = trpc.alert.getUnread.useQuery(
    undefined,
    {
      refetchInterval: 60000, // Poll every 60 seconds
    }
  )

  const snoozeMutation = trpc.alert.snooze.useMutation({
    onSuccess: () => {
      utils.alert.getUnread.invalidate()
      toast({
        title: 'Alert snoozed',
        description: 'You will be reminded again in 24 hours.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const dismissMutation = trpc.alert.dismiss.useMutation({
    onSuccess: () => {
      utils.alert.getUnread.invalidate()
      toast({
        title: 'Alert dismissed',
        description: 'This alert will not appear again.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSnooze = (alertId: string) => {
    snoozeMutation.mutate({ alertId })
  }

  const handleDismiss = (alertId: string) => {
    dismissMutation.mutate({ alertId })
  }

  const handleNavigate = (applicationId: string) => {
    router.push(`/applications/${applicationId}`)
  }

  // Sort alerts by urgency (CRITICAL first)
  const sortedAlerts = [...(alerts ?? [])].sort((a, b) => {
    const order = ['DEADLINE_TODAY', 'DEADLINE_1D', 'DEADLINE_3D', 'DEADLINE_7D', 'DEADLINE_14D', 'DEADLINE_30D']
    return order.indexOf(a.alertType) - order.indexOf(b.alertType)
  })

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Deadline Alerts</h3>
          <span className="text-sm text-muted-foreground">
            {alerts?.length ?? 0} active
          </span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading alerts...
            </div>
          )}

          {!isLoading && sortedAlerts.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No active alerts. You're all caught up!
              </p>
            </div>
          )}

          {!isLoading &&
            sortedAlerts.map((alert) => {
              const urgencyLevel = getUrgencyLevel(alert.alertType)
              const config = getUrgencyConfig(urgencyLevel)
              const Icon = config.icon

              const daysRemaining = alert.application.targetSubmitDate
                ? differenceInDays(
                    alert.application.targetSubmitDate,
                    new Date()
                  )
                : 0

              const deadline = alert.application.targetSubmitDate
                ? format(alert.application.targetSubmitDate, 'MMM d, yyyy')
                : 'No deadline'

              return (
                <Card
                  key={alert.id}
                  className={cn(
                    'mx-2 my-2 cursor-pointer border-l-4 p-3 transition-colors hover:bg-accent',
                    config.borderColor
                  )}
                  onClick={() => handleNavigate(alert.application.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5', config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {alert.application.scholarship.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${alert.application.scholarship.awardAmount.toLocaleString()} •{' '}
                        {deadline}
                      </p>
                      <p className={cn('text-xs font-medium', config.color)}>
                        {daysRemaining === 0
                          ? 'Due TODAY'
                          : daysRemaining === 1
                          ? 'Due tomorrow'
                          : `${daysRemaining} days remaining`}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss(alert.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSnooze(alert.id)
                      }}
                    >
                      Snooze 24h
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigate(alert.application.id)
                      }}
                    >
                      View Application
                    </Button>
                  </div>
                </Card>
              )
            })}
        </div>

        {sortedAlerts.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => router.push('/applications')}
              >
                View All Applications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
