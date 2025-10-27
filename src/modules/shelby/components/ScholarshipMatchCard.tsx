/**
 * ScholarshipMatchCard Component
 *
 * Displays a single scholarship match with:
 * - Name, provider, match score
 * - Award amount
 * - Deadline with days remaining (color-coded)
 * - Actions (View Details, Add to Applications)
 *
 * @component
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { differenceInDays, format } from 'date-fns'
import Link from 'next/link'
import type { MatchWithScholarship } from '../types'

interface ScholarshipMatchCardProps {
  match: MatchWithScholarship
}

export function ScholarshipMatchCard({ match }: ScholarshipMatchCardProps) {
  const { scholarship, overallMatchScore } = match
  const daysRemaining = differenceInDays(new Date(scholarship.deadline), new Date())

  // Color code deadline urgency
  const getDeadlineColor = (days: number) => {
    if (days < 0) return 'text-red-600 font-bold'
    if (days < 15) return 'text-red-600'
    if (days < 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const deadlineColor = getDeadlineColor(daysRemaining)
  const deadlineText =
    daysRemaining < 0
      ? 'Deadline passed'
      : daysRemaining === 0
        ? 'Due today!'
        : daysRemaining === 1
          ? '1 day left'
          : `${daysRemaining} days left`

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-l-orange-400">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Scholarship Info */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 hover:text-orange-600 transition-colors">
              {scholarship.name}
            </h3>
            <p className="text-sm text-muted-foreground">{scholarship.provider}</p>
          </div>

          {/* Badges and Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="default"
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold"
            >
              Match: {Math.round(overallMatchScore)}%
            </Badge>

            <span className="text-lg font-bold text-gray-900">
              ${scholarship.awardAmount.toLocaleString()}
              {scholarship.awardAmountMax && scholarship.awardAmountMax > scholarship.awardAmount && (
                <span className="text-sm text-muted-foreground font-normal">
                  {' '}
                  - ${scholarship.awardAmountMax.toLocaleString()}
                </span>
              )}
            </span>

            <span className={cn('text-sm font-medium', deadlineColor)}>
              {deadlineText} ({format(new Date(scholarship.deadline), 'MMM d, yyyy')})
            </span>
          </div>

          {/* Description */}
          {scholarship.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">{scholarship.description}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 md:w-auto w-full">
          <Link href={`/scholarships/${scholarship.id}`}>
            <Button variant="outline" className="w-full md:w-auto border-orange-300 hover:bg-orange-50">
              View Details
            </Button>
          </Link>
          <Link href={`/applications/new?scholarshipId=${scholarship.id}`}>
            <Button className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white">
              Add to Applications
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
