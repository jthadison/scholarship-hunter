/**
 * AtRiskBanner Component
 * Story 3.10 - Task 2 (AC #2)
 *
 * Dashboard warning banner displaying count of at-risk applications
 * with prominent placement above pipeline.
 *
 * Features:
 * - Alert count display: "⚠️ Warning: 2 applications at risk"
 * - "View At-Risk" button to filter dashboard
 * - Dismissible with preference storage
 * - Urgency animation for critical (1-day) alerts
 */

"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface AtRiskBannerProps {
  atRiskCount: number
  criticalCount: number // Applications with <1 day deadline
  onViewAtRisk: () => void
  onDismiss?: () => void
}

/**
 * Dashboard banner for at-risk applications
 * Subtask 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function AtRiskBanner({
  atRiskCount,
  criticalCount,
  onViewAtRisk,
  onDismiss,
}: AtRiskBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [previousCount, setPreviousCount] = useState(atRiskCount)

  // Subtask 2.5: Reappear if count changes after dismissal
  useEffect(() => {
    if (atRiskCount !== previousCount) {
      setDismissed(false)
      setPreviousCount(atRiskCount)

      // Load dismissal preference from localStorage
      const dismissalKey = `at-risk-banner-dismissed-${atRiskCount}`
      const wasDismissed = localStorage.getItem(dismissalKey) === "true"
      setDismissed(wasDismissed)
    }
  }, [atRiskCount, previousCount])

  const handleDismiss = () => {
    setDismissed(true)

    // Subtask 2.5: Store dismissal preference
    const dismissalKey = `at-risk-banner-dismissed-${atRiskCount}`
    localStorage.setItem(dismissalKey, "true")

    onDismiss?.()
  }

  // Don't show banner if dismissed or no at-risk applications
  if (dismissed || atRiskCount === 0) {
    return null
  }

  // Subtask 2.6: Urgency animation for critical alerts (deadline <1 day)
  const hasCritical = criticalCount > 0
  const urgencyClass = hasCritical ? "animate-pulse" : ""

  return (
    <Alert
      data-testid="at-risk-banner"
      className={cn(
        // Subtask 2.1: Alert styling (red/orange gradient)
        "border-2 border-red-500 bg-gradient-to-r from-red-50 to-orange-50",
        "dark:from-red-950/20 dark:to-orange-950/20",
        // Subtask 2.4: Fixed positioning at top
        "sticky top-0 z-50 mb-4",
        // Urgency animation
        urgencyClass
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Icon and Message */}
        <div className="flex items-center gap-3">
          <AlertTriangle
            className={cn(
              "h-5 w-5",
              hasCritical ? "text-red-600" : "text-orange-600"
            )}
          />

          {/* Subtask 2.2: Display count */}
          <AlertDescription className="text-sm font-medium">
            <span className="text-red-600 dark:text-red-400">
              ⚠️ Warning:{" "}
            </span>
            <span className="font-semibold">
              {atRiskCount} application{atRiskCount !== 1 ? "s" : ""} at risk
            </span>
            {hasCritical && (
              <span className="ml-2 text-xs text-red-700 dark:text-red-300">
                ({criticalCount} critical - deadline &lt;24 hours)
              </span>
            )}
          </AlertDescription>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Subtask 2.3: View At-Risk button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAtRisk}
            className="border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Eye className="mr-2 h-4 w-4" />
            View At-Risk
          </Button>

          {/* Subtask 2.5: Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
