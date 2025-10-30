/**
 * Essay Library Overview Component
 *
 * Displays completed essays in the library
 * Shows themes, quality scores, and quick access
 *
 * @component
 * Story 4.10: AC1 - Essay library overview
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Library, Star, FileText } from 'lucide-react'
import Link from 'next/link'

interface EssayLibraryOverviewProps {
  essays: Array<{
    id: string
    title: string
    themes: string[]
    qualityScore: number | null
    wordCount: number
    createdAt: Date
    updatedAt: Date
  }>
}

export function EssayLibraryOverview({ essays }: EssayLibraryOverviewProps) {
  if (essays.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <Library className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Build Your Essay Library
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Complete essays will appear here and can be reused for multiple scholarships!
        </p>
      </div>
    )
  }

  // Sort by quality score (highest first), then by most recent
  const sortedEssays = [...essays].sort((a, b) => {
    if (a.qualityScore !== null && b.qualityScore !== null) {
      return b.qualityScore - a.qualityScore
    }
    if (a.qualityScore !== null) return -1
    if (b.qualityScore !== null) return 1
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })

  // Show top 5 essays
  const displayedEssays = sortedEssays.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {essays.length} {essays.length === 1 ? 'essay' : 'essays'} in your library
        </p>
        {essays.length > 5 && (
          <Link
            href="/dashboard/essays/library"
            className="text-sm text-coral-600 hover:text-coral-700 font-medium"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {displayedEssays.map((essay) => {
          const qualityColor =
            essay.qualityScore !== null
              ? essay.qualityScore >= 80
                ? 'text-green-600'
                : essay.qualityScore >= 60
                  ? 'text-yellow-600'
                  : 'text-orange-600'
              : 'text-gray-400'

          return (
            <Card
              key={essay.id}
              className="border-amber-200 hover:border-amber-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{essay.title}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {essay.qualityScore !== null && (
                          <Badge variant="outline" className="text-xs">
                            <Star className={`h-3 w-3 mr-1 ${qualityColor}`} />
                            <span className={qualityColor}>{essay.qualityScore}/100</span>
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {essay.wordCount} words
                        </Badge>
                      </div>
                    </div>

                    {/* Themes */}
                    {essay.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {essay.themes.slice(0, 3).map((theme) => (
                          <Badge
                            key={theme}
                            variant="outline"
                            className="text-xs bg-amber-50 border-amber-200 text-amber-700"
                          >
                            {theme}
                          </Badge>
                        ))}
                        {essay.themes.length > 3 && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            +{essay.themes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Link href={`/dashboard/essays/${essay.id}`}>
                          View Essay
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {essays.length > 0 && (
        <Button
          asChild
          variant="outline"
          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Link href="/dashboard/essays/library">
            <Library className="h-4 w-4 mr-2" />
            Browse Full Library
          </Link>
        </Button>
      )}
    </div>
  )
}
