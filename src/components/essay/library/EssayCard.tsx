/**
 * EssayCard Component (Story 4.8 - Task 2, Task 6)
 *
 * Displays essay metadata in card format with theme badges and adaptability score
 * AC1: Card shows title, scholarship, word count, themes, completion date, quality score
 * AC3: Adaptability badge displayed when in new essay context
 *
 * @module components/essay/library/EssayCard
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, AlignLeft, Star, TrendingUp, Eye, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { THEME_COLORS } from '@/server/services/essayThemeExtractor'
import type { AdaptabilityScore } from '@/server/services/essayAdaptability'

interface EssayCardProps {
  essay: {
    id: string
    title: string
    wordCount: number
    themes: string[]
    qualityScore: number | null
    updatedAt: Date
    application?: {
      scholarship: {
        name: string
      }
    } | null
  }
  adaptabilityScore?: AdaptabilityScore
  showAdaptabilityBadge?: boolean
  onPreview: () => void
  onRefetch?: () => void
}

/**
 * Get theme color class based on theme name
 */
function getThemeColorClass(theme: string): string {
  const color = (THEME_COLORS as Record<string, string>)[theme] || 'gray'
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  }
  return colorMap[color] || colorMap['gray'] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
}

/**
 * Get adaptability badge variant and label
 * AC3: Color-coded scores (90-100% green, 70-89% blue, 50-69% yellow, <50% gray)
 */
function getAdaptabilityBadge(score: number): { variant: string; label: string; className: string } {
  if (score >= 90) {
    return {
      variant: 'success',
      label: 'Highly Adaptable',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    }
  } else if (score >= 70) {
    return {
      variant: 'info',
      label: 'Adaptable',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    }
  } else if (score >= 50) {
    return {
      variant: 'warning',
      label: 'Partially Adaptable',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    }
  } else {
    return {
      variant: 'secondary',
      label: 'Low Adaptability',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    }
  }
}

/**
 * EssayCard Component
 * Displays essay summary with themes, quality score, and adaptability
 */
export function EssayCard({
  essay,
  adaptabilityScore,
  showAdaptabilityBadge,
  onPreview,
}: EssayCardProps) {
  const adaptabilityBadge = adaptabilityScore ? getAdaptabilityBadge(adaptabilityScore.score) : null

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" role="listitem">
      <CardHeader className="pb-3" onClick={onPreview}>
        {/* Adaptability Badge (if in new essay context) */}
        {showAdaptabilityBadge && adaptabilityScore && adaptabilityBadge && (
          <div className="mb-2">
            <Badge className={`${adaptabilityBadge.className} font-semibold`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {adaptabilityScore.score}% {adaptabilityBadge.label}
            </Badge>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {essay.title}
        </h3>

        {/* Scholarship Name */}
        {essay.application?.scholarship && (
          <p className="text-sm text-muted-foreground mt-1">
            {essay.application.scholarship.name}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-3" onClick={onPreview}>
        {/* Metadata Grid */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* Word Count */}
          <div className="flex items-center gap-2">
            <AlignLeft className="h-4 w-4" />
            <span>{essay.wordCount} words</span>
          </div>

          {/* Completion Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Completed {format(new Date(essay.updatedAt), 'MMM d, yyyy')}</span>
          </div>

          {/* Quality Score */}
          {essay.qualityScore !== null && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Quality: {Math.round(essay.qualityScore)}/100</span>
            </div>
          )}
        </div>

        {/* Theme Tags */}
        {essay.themes && essay.themes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {essay.themes.slice(0, 5).map((theme) => (
              <Badge
                key={theme}
                variant="outline"
                className={`text-xs ${getThemeColorClass(theme)}`}
              >
                {theme.replace(/-/g, ' ')}
              </Badge>
            ))}
            {essay.themes.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{essay.themes.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        {/* View Button */}
        <Button variant="outline" size="sm" onClick={onPreview} className="flex-1" aria-label={`View ${essay.title}`}>
          <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
          View
        </Button>

        {/* Clone & Adapt Button (if adaptability > 50%) */}
        {adaptabilityScore && adaptabilityScore.score > 50 && (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement clone functionality
              alert('Clone & Adapt functionality coming soon!')
            }}
            className="flex-1"
            aria-label={`Clone and adapt ${essay.title}`}
          >
            <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
            Clone & Adapt
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
