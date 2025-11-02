/**
 * Scholarship Card Component
 *
 * Displays scholarship summary in search results and listings.
 * Shows key information: name, provider, award amount, deadline, match score, priority tier.
 *
 * Features:
 * - Clickable to navigate to detail page
 * - Shows match data for authenticated users
 * - Priority tier color-coded badge
 * - Responsive layout
 *
 * @module components/scholarships/ScholarshipCard
 */

'use client'

import Link from 'next/link'
import { Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface ScholarshipCardProps {
  scholarship: {
    id: string
    name: string
    provider: string
    awardAmount: number | null
    deadline: Date | null
    description: string | null
    matches?: Array<{
      overallMatchScore: number
      priorityTier: 'MUST_APPLY' | 'SHOULD_APPLY' | 'IF_TIME_PERMITS' | 'HIGH_VALUE_REACH'
      strategicValue: number | null
    }>
  }
}

// Priority tier display config
const TIER_CONFIG = {
  MUST_APPLY: {
    label: 'Must Apply',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  SHOULD_APPLY: {
    label: 'Should Apply',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  IF_TIME_PERMITS: {
    label: 'If Time Permits',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  HIGH_VALUE_REACH: {
    label: 'High Value Reach',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
}

/**
 * Scholarship card component
 *
 * Displays scholarship with match data if available.
 * Hover effect and cursor pointer for interactivity.
 */
export function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const match = scholarship.matches?.[0]
  const hasMatchData = match !== undefined

  // Format deadline
  const deadlineText = scholarship.deadline
    ? `Due ${formatDistanceToNow(scholarship.deadline, { addSuffix: true })}`
    : 'No deadline'

  // Format award amount
  const awardText = scholarship.awardAmount
    ? `$${scholarship.awardAmount.toLocaleString()}`
    : 'Amount varies'

  return (
    <Link href={`/scholarships/${scholarship.id}`} className="block cursor-pointer">
      <div className="group relative rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        {/* Header: Name + Priority Badge */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold group-hover:text-primary">
              {scholarship.name}
            </h3>
            <p className="text-sm text-muted-foreground">{scholarship.provider}</p>
          </div>

          {/* Priority Tier Badge (authenticated users only) */}
          {hasMatchData && (
            <div
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                TIER_CONFIG[match.priorityTier].color
              }`}
            >
              {TIER_CONFIG[match.priorityTier].label}
            </div>
          )}
        </div>

        {/* Description (truncated) */}
        {scholarship.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {scholarship.description}
          </p>
        )}

        {/* Meta Info: Award, Deadline, Match Score */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Award Amount */}
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{awardText}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{deadlineText}</span>
          </div>

          {/* Match Score (authenticated users only) */}
          {hasMatchData && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{match.overallMatchScore}% match</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
