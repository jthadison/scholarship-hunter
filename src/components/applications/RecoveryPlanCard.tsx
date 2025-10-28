/**
 * RecoveryPlanCard Component
 * Story 3.10 - Task 4 (AC #4)
 *
 * Displays specific, actionable recovery recommendations for at-risk applications.
 * Shows prioritized recommendations with time-specific guidance.
 *
 * Features:
 * - Specific recommendations: "Complete essay by tomorrow 8 PM"
 * - Prioritized by blocking factor (essay > docs > recs)
 * - Time-specific guidance using timeline data
 * - Visual priority indicators
 */

"use client"

import { Clock, FileText, Upload, UserCheck, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RecoveryRecommendation } from "@/lib/at-risk/recovery"

interface RecoveryPlanCardProps {
  recommendations: RecoveryRecommendation[]
  daysUntilDeadline: number
  className?: string
}

/**
 * Recovery plan display component
 * Subtask 4.4: Display recommendations in ApplicationWorkspace
 */
export function RecoveryPlanCard({
  recommendations,
  daysUntilDeadline,
  className,
}: RecoveryPlanCardProps) {
  if (recommendations.length === 0) {
    return null
  }

  // Icon mapping for recommendation types
  const typeIcons = {
    ESSAY: FileText,
    DOCUMENT: Upload,
    RECOMMENDATION: UserCheck,
  }

  // Color mapping for blocker levels
  const blockerStyles = {
    HIGH: "border-red-300 bg-red-50 dark:bg-red-950/20",
    MEDIUM: "border-orange-300 bg-orange-50 dark:bg-orange-950/20",
    LOW: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20",
  }

  return (
    <Card className={cn("border-red-200", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Recovery Plan
            </CardTitle>
            <CardDescription>
              {daysUntilDeadline} day{daysUntilDeadline === 1 ? "" : "s"} until
              deadline - complete these actions to get back on track
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Subtask 4.6: Recommendations sorted by priority */}
          {recommendations.map((rec, index) => {
            const Icon = typeIcons[rec.type]

            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  blockerStyles[rec.blockerLevel]
                )}
              >
                {/* Priority indicator */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-700">
                  {rec.priority}
                </div>

                {/* Icon */}
                <div className="shrink-0 pt-0.5">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  {/* Subtask 4.3, 4.5: Time-specific message */}
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rec.message}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        rec.blockerLevel === "HIGH" && "border-red-400 text-red-700",
                        rec.blockerLevel === "MEDIUM" &&
                          "border-orange-400 text-orange-700",
                        rec.blockerLevel === "LOW" && "border-yellow-400 text-yellow-700"
                      )}
                    >
                      {rec.blockerLevel} Priority
                    </Badge>

                    {rec.estimatedHours > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{rec.estimatedHours}h
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary footer */}
        <div className="mt-4 rounded-md bg-gray-50 p-3 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 <strong>Tip:</strong> Focus on Priority 1 first. Essays typically
            take the longest, so start there if behind schedule.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
