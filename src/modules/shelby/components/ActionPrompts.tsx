/**
 * ActionPrompts Component
 *
 * Displays dynamic call-to-action prompts based on student's matches:
 * - Upcoming deadline prompt for closest MUST_APPLY scholarship
 * - Exploration prompt for SHOULD_APPLY opportunities
 *
 * @component
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Search } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import Link from 'next/link'
import type { MatchWithScholarship } from '../types'

interface ActionPromptsProps {
  matches: MatchWithScholarship[]
  tierCounts: {
    MUST_APPLY: number
    SHOULD_APPLY: number
    IF_TIME_PERMITS: number
    HIGH_VALUE_REACH: number
  }
}

export function ActionPrompts({ matches, tierCounts }: ActionPromptsProps) {
  // Find scholarship with closest deadline
  const closestDeadlineMatch = matches.reduce((closest, match) => {
    if (!closest) return match
    return new Date(match.scholarship.deadline) < new Date(closest.scholarship.deadline)
      ? match
      : closest
  }, matches[0])

  const daysUntilDeadline = closestDeadlineMatch
    ? differenceInDays(new Date(closestDeadlineMatch.scholarship.deadline), new Date())
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Upcoming Deadline Prompt */}
      {closestDeadlineMatch && daysUntilDeadline >= 0 && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-orange-300">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Upcoming Deadline!</h3>
              <p className="text-sm text-gray-700 mb-3">
                Apply to{' '}
                <span className="font-bold">{closestDeadlineMatch.scholarship.name}</span> by{' '}
                <span className="font-bold">
                  {format(new Date(closestDeadlineMatch.scholarship.deadline), 'MMM d, yyyy')}
                </span>{' '}
                ({daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'} left)
              </p>
              <Link href={`/scholarships/${closestDeadlineMatch.scholarship.id}`}>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Start Application
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Exploration Prompt */}
      {tierCounts.SHOULD_APPLY > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300">
          <div className="flex items-start gap-3">
            <Search className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">More Opportunities!</h3>
              <p className="text-sm text-gray-700 mb-3">
                Explore <span className="font-bold">{tierCounts.SHOULD_APPLY}</span> SHOULD_APPLY{' '}
                {tierCounts.SHOULD_APPLY === 1 ? 'opportunity' : 'opportunities'} that match your
                profile.
              </p>
              <Link href="/scholarships?tier=SHOULD_APPLY">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-400 hover:bg-blue-50"
                >
                  Explore Now
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* No MUST_APPLY scholarships edge case */}
      {matches.length === 0 && (
        <Card className="col-span-2 p-6">
          <Alert>
            <AlertDescription>
              Build your profile to unlock MUST_APPLY matches! The more complete your profile, the
              better matches I can find for you.
            </AlertDescription>
          </Alert>
        </Card>
      )}
    </div>
  )
}
