/**
 * AtRiskIndicator Component
 * Story 3.10 - Task 3 (AC #3)
 *
 * Visual indicator for at-risk applications on ApplicationCard.
 * Shows alert icon with color-coded urgency and tooltip.
 *
 * Features:
 * - Red alert icon (AlertTriangle from lucide-react)
 * - Color-coded urgency: Yellow (7 days), Orange (3 days), Red (1 day)
 * - Tooltip on hover with details
 * - Pulsing border animation for critical (1-day) alerts
 */

"use client"

import { AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Severity } from "@prisma/client"

interface AtRiskIndicatorProps {
  severity: Severity
  daysUntilDeadline: number
  progressPercentage: number
  className?: string
}

/**
 * Visual indicator badge for at-risk applications
 * Subtask 3.1, 3.2, 3.3, 3.4
 */
export function AtRiskIndicator({
  severity,
  daysUntilDeadline,
  progressPercentage,
  className,
}: AtRiskIndicatorProps) {
  // Subtask 3.2: Color-coded urgency levels
  const severityColors = {
    WARNING: "text-yellow-600 dark:text-yellow-400", // 7-day
    URGENT: "text-orange-600 dark:text-orange-400", // 3-day
    CRITICAL: "text-red-600 dark:text-red-400", // 1-day
  }

  const borderColors = {
    WARNING: "ring-yellow-400",
    URGENT: "ring-orange-400",
    CRITICAL: "ring-red-500",
  }

  const iconColor = severityColors[severity]
  const borderColor = borderColors[severity]

  // Subtask 3.4: Pulsing animation for critical alerts
  const isCritical = severity === "CRITICAL"

  // Subtask 3.3: Tooltip message
  const tooltipMessage = `At Risk: Deadline in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}, ${Math.round(progressPercentage)}% complete`

  return (
    <TooltipProvider>
      <Tooltip>
        {/* Subtask 3.1: Alert triangle icon */}
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              "ring-2 ring-offset-2",
              borderColor,
              // Subtask 3.4: Pulsing border for critical
              isCritical && "animate-pulse",
              className
            )}
          >
            <AlertTriangle className={cn("h-5 w-5", iconColor)} />
          </div>
        </TooltipTrigger>

        {/* Subtask 3.3: Tooltip with details */}
        <TooltipContent>
          <p className="text-sm font-medium">{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Compact badge version for smaller spaces
 */
export function AtRiskBadge({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  const severityLabels = {
    WARNING: "At Risk",
    URGENT: "Urgent",
    CRITICAL: "Critical",
  }

  const severityStyles = {
    WARNING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    URGENT: "bg-orange-100 text-orange-800 border-orange-300",
    CRITICAL: "bg-red-100 text-red-800 border-red-300",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold",
        severityStyles[severity],
        severity === "CRITICAL" && "animate-pulse",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {severityLabels[severity]}
    </span>
  )
}
