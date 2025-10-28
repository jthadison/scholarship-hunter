/**
 * QuinnInterventionCard Component
 * Story 3.10 - Task 5 (AC #5)
 *
 * Quinn's contextual intervention message for at-risk applications.
 * Provides urgency-appropriate guidance and action buttons.
 *
 * Features:
 * - Agent avatar with Quinn persona
 * - Contextual message: "This application needs immediate attention..."
 * - Action buttons: Show Timeline, Mark Complete, Request Help
 * - Different message variants for urgency levels
 * - Defer option for IF_TIME_PERMITS tier
 */

"use client"

import { Calendar, CheckCircle, HelpCircle, Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Severity, PriorityTier } from "@prisma/client"
import { getQuinnMessage } from "@/lib/at-risk/recovery"

interface QuinnInterventionCardProps {
  severity: Severity
  daysUntilDeadline: number
  priorityTier?: PriorityTier | null
  onShowTimeline?: () => void
  onMarkComplete?: () => void
  onRequestHelp?: () => void
  onDefer?: () => void
  className?: string
}

/**
 * Quinn intervention card for at-risk applications
 * Subtask 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export function QuinnInterventionCard({
  severity,
  daysUntilDeadline,
  priorityTier,
  onShowTimeline,
  onMarkComplete,
  onRequestHelp,
  onDefer,
  className,
}: QuinnInterventionCardProps) {
  // Subtask 5.5: Different message variants based on urgency level
  const message = getQuinnMessage(daysUntilDeadline, severity)

  // Subtask 5.6: Show defer option for IF_TIME_PERMITS tier
  const canDefer = priorityTier === "IF_TIME_PERMITS"

  return (
    <Card
      className={cn(
        "border-2",
        severity === "CRITICAL" && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
        severity === "URGENT" &&
          "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20",
        severity === "WARNING" &&
          "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Subtask 5.1: Agent avatar */}
          <Avatar className="h-12 w-12 border-2 border-purple-300">
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-lg font-bold text-white">
              Q
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <CardTitle className="text-base">
              Quinn - Timeline Coordinator
            </CardTitle>
            <CardDescription className="mt-1">
              {/* Subtask 5.2: Contextual message */}
              {message}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Subtask 5.3: Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShowTimeline}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Show Timeline
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onMarkComplete}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Mark Complete
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRequestHelp}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Request Help
          </Button>

          {/* Subtask 5.6: Defer option for IF_TIME_PERMITS */}
          {canDefer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDefer}
              className="gap-2 text-gray-600"
            >
              <Clock className="h-4 w-4" />
              Defer Application
            </Button>
          )}
        </div>

        {/* Urgency-specific footer */}
        {severity === "CRITICAL" && (
          <div className="mt-4 rounded-md bg-red-100 p-2 dark:bg-red-950/40">
            <p className="text-xs font-medium text-red-800 dark:text-red-200">
              ⏰ Critical deadline! Focus all effort on completing this
              application immediately.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
