/**
 * RoadmapTimeline Component
 *
 * Displays recommended improvements on timeline with target dates and milestones.
 * Vertical timeline on mobile, can expand to show full roadmap.
 *
 * Story: 5.3 - Gap Analysis (AC #4, #6)
 * @module components/gap-analysis/RoadmapTimeline
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecommendationCard } from './RecommendationCard'
import type { Roadmap } from '@/lib/gap-analysis/types'
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface RoadmapTimelineProps {
  roadmap: Roadmap
}

export function RoadmapTimeline({ roadmap }: RoadmapTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalRecommendations =
    roadmap.easy.length + roadmap.moderate.length + roadmap.longTerm.length

  if (totalRecommendations === 0) {
    return null
  }

  // Show first 3 recommendations when collapsed
  const displayRecommendations = isExpanded
    ? roadmap.recommendedSequence
    : roadmap.recommendedSequence.slice(0, 3)

  const hiddenCount = roadmap.recommendedSequence.length - 3

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Improvement Roadmap
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Follow this strategic plan to unlock {roadmap.easy.length + roadmap.moderate.length + roadmap.longTerm.length} scholarship opportunities
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Estimated Timeline</p>
            <p className="text-lg font-bold text-blue-600">
              {roadmap.totalTimelineMonths} month{roadmap.totalTimelineMonths !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Timeline Items */}
        <div className="space-y-3">
          {displayRecommendations.map((rec, idx) => (
            <div key={idx} className="relative">
              {/* Timeline connector (vertical line) */}
              {idx < displayRecommendations.length - 1 && (
                <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Timeline dot */}
              <div className="absolute left-0 top-3 h-5 w-5 rounded-full bg-blue-600 border-4 border-white shadow" />

              {/* Recommendation Card */}
              <div className="ml-10">
                <RecommendationCard recommendation={rec} />
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {!isExpanded && hiddenCount > 0 && (
          <div className="pt-3 text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(true)}
              className="w-full sm:w-auto"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Show {hiddenCount} More Recommendation{hiddenCount !== 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {isExpanded && hiddenCount > 0 && (
          <div className="pt-3 text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(false)}
              className="w-full sm:w-auto"
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
          <p>
            <strong>Pro Tip:</strong> Start with the Quick Wins to build momentum, then tackle
            moderate improvements while working on 1-2 long-term goals in the background.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
