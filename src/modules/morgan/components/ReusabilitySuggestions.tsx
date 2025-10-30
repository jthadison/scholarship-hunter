/**
 * Reusability Suggestions Component
 *
 * Displays top reusability opportunities:
 * - Library essay details
 * - Adaptability score
 * - Target scholarship
 * - "Adapt Essay" action button
 *
 * @component
 * Story 4.10: AC4 - Reusability suggestions
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Recycle, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface ReusabilitySuggestionsProps {
  suggestions: Array<{
    essay: {
      id: string
      title: string
      themes: string[]
      wordCount: number
    }
    adaptabilityScore: number
    targetScholarship: {
      id: string
      name: string
      deadline: Date
    }
    targetPrompt: string
    matchingThemes: string[]
    adaptableSections: string[]
  }>
  isLoading: boolean
}

export function ReusabilitySuggestions({
  suggestions,
  isLoading,
}: ReusabilitySuggestionsProps) {
  if (isLoading) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Recycle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900">
              Smart Reusability Suggestions
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Your existing essays can be adapted for these scholarships!
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const scoreColor =
            suggestion.adaptabilityScore >= 90
              ? 'bg-green-600'
              : suggestion.adaptabilityScore >= 80
                ? 'bg-green-500'
                : 'bg-yellow-500'

          const scoreLabel =
            suggestion.adaptabilityScore >= 90
              ? 'Excellent Match'
              : suggestion.adaptabilityScore >= 80
                ? 'Great Match'
                : 'Good Match'

          const daysUntilDeadline = Math.ceil(
            (suggestion.targetScholarship.deadline.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )

          return (
            <Card
              key={`${suggestion.essay.id}-${suggestion.targetScholarship.id}`}
              className="border-green-300 bg-white hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Adaptability score badge */}
                  <div className="flex-shrink-0">
                    <div className={`${scoreColor} text-white rounded-lg p-3 text-center`}>
                      <div className="text-2xl font-bold">
                        {suggestion.adaptabilityScore}%
                      </div>
                      <div className="text-xs">{scoreLabel}</div>
                    </div>
                  </div>

                  {/* Suggestion details */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Your "<span className="font-semibold text-gray-900">{suggestion.essay.title}</span>" essay is{' '}
                        <span className="font-semibold text-green-600">
                          {suggestion.adaptabilityScore}% adaptable
                        </span>{' '}
                        for:
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {suggestion.targetScholarship.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {daysUntilDeadline} days until deadline
                        </Badge>
                      </div>
                    </div>

                    {/* Matching themes */}
                    {suggestion.matchingThemes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-600">Matching themes:</span>
                        {suggestion.matchingThemes.slice(0, 3).map((theme) => (
                          <Badge
                            key={theme}
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700"
                          >
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Target prompt preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-xs text-gray-600 font-medium mb-1">New prompt:</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {suggestion.targetPrompt}
                      </p>
                    </div>

                    {/* Action button */}
                    <Button
                      asChild
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Link href={`/dashboard/essays/${suggestion.essay.id}/adapt`}>
                        <Recycle className="h-4 w-4 mr-2" />
                        Adapt This Essay
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
