/**
 * RecommendationCard Component
 *
 * Displays detailed recommendation with gap description, specific action steps,
 * timeline, achievability indicator, resource links, and progress tracking.
 *
 * Story: 5.3 - Gap Analysis (AC #4, #6)
 * @module components/gap-analysis/RecommendationCard
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recommendation } from '@/lib/gap-analysis/types'
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar,
  ListChecks,
  Lightbulb,
} from 'lucide-react'
import { useState } from 'react'

export interface RecommendationCardProps {
  recommendation: Recommendation
  onToggleProgress?: (completed: boolean) => void
}

export function RecommendationCard({
  recommendation,
  onToggleProgress,
}: RecommendationCardProps) {
  const [isCompleted, setIsCompleted] = useState(false)

  const achievabilityColors = {
    EASY: 'bg-green-100 text-green-700 border-green-300',
    MODERATE: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    LONG_TERM: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const handleToggle = () => {
    const newState = !isCompleted
    setIsCompleted(newState)
    onToggleProgress?.(newState)
  }

  const targetDateStr = new Date(recommendation.targetDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card className={isCompleted ? 'opacity-60 border-green-300 bg-green-50/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleToggle}
              className="mt-1 flex-shrink-0 transition-colors"
              aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {recommendation.gap.requirement}
              </h3>
              <p className="text-sm text-gray-600">{recommendation.recommendation}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={achievabilityColors[recommendation.gap.achievability]}
          >
            {recommendation.timeline}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline & Impact */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Target: {targetDateStr}</span>
          </div>
          <span>•</span>
          <span>{recommendation.gap.impact}</span>
        </div>

        {/* Action Steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <ListChecks className="h-4 w-4" />
            Action Steps
          </div>
          <ul className="space-y-1.5 pl-6">
            {recommendation.actionSteps.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600 list-disc">
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        {recommendation.resources.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Lightbulb className="h-4 w-4" />
              Helpful Resources
            </div>
            <div className="space-y-1.5">
              {recommendation.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{resource.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {recommendation.dependencies && recommendation.dependencies.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> {recommendation.dependencies.join('. ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
