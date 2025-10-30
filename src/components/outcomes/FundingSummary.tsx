/**
 * FundingSummary Component
 *
 * Displays aggregate scholarship success metrics on dashboard:
 * - Total awards, denials, pending applications
 * - Total funding secured
 * - Success rate
 * - Visual indicators by outcome type
 *
 * Story: 5.1 - Outcome Tracking & Status Updates (AC #5)
 * @module components/outcomes/FundingSummary
 */

'use client'

import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, XCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'

export function FundingSummary() {
  const { data, isLoading, isError } = trpc.outcome.getByStudent.useQuery()

  if (isLoading) {
    return <FundingSummarySkeleton />
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Success Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load success metrics. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { summary } = data
  const {
    totalAwarded,
    totalDenied,
    totalWaitlisted,
    totalPending,
    totalFundingSecured,
    successRate,
  } = summary

  const successPercentage = Math.round(successRate * 100)
  const totalDecisions = totalAwarded + totalDenied + totalWaitlisted

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Success Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Text */}
        <div className="mb-6 rounded-lg bg-muted p-4">
          <p className="text-lg font-semibold">
            {totalAwarded > 0 ? (
              <>
                <span className="text-green-600">{totalAwarded} award{totalAwarded !== 1 ? 's' : ''}</span>
                {totalDenied > 0 && (
                  <>
                    , <span className="text-red-600">{totalDenied} denial{totalDenied !== 1 ? 's' : ''}</span>
                  </>
                )}
                {totalPending > 0 && (
                  <>
                    , <span className="text-yellow-600">{totalPending} pending</span>
                  </>
                )}
                {totalFundingSecured > 0 && (
                  <>
                    {' - '}
                    <span className="text-green-700 font-bold">
                      ${totalFundingSecured.toLocaleString()}
                    </span>
                    {' '}total funding secured
                  </>
                )}
              </>
            ) : totalDenied > 0 ? (
              <>
                <span className="text-red-600">{totalDenied} denial{totalDenied !== 1 ? 's' : ''}</span>
                {totalPending > 0 && (
                  <>
                    , <span className="text-yellow-600">{totalPending} pending</span>
                  </>
                )}
              </>
            ) : totalPending > 0 ? (
              <span className="text-yellow-600">{totalPending} pending application{totalPending !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-muted-foreground">No applications yet</span>
            )}
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Awards */}
          <div className="flex flex-col gap-1 rounded-md border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Awards</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{totalAwarded}</p>
          </div>

          {/* Denials */}
          <div className="flex flex-col gap-1 rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Denials</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{totalDenied}</p>
          </div>

          {/* Pending */}
          <div className="flex flex-col gap-1 rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{totalPending}</p>
          </div>

          {/* Success Rate */}
          <div className="flex flex-col gap-1 rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {totalDecisions > 0 ? `${successPercentage}%` : '—'}
            </p>
          </div>
        </div>

        {/* Total Funding Card (if any awards) */}
        {totalAwarded > 0 && (
          <div className="mt-4 rounded-lg border-2 border-green-300 bg-green-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-600 p-2">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Total Funding Secured</p>
                  <p className="text-3xl font-bold text-green-700">
                    ${totalFundingSecured.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waitlisted Info (if any) */}
        {totalWaitlisted > 0 && (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-700">
              <span className="font-medium">{totalWaitlisted}</span> application{totalWaitlisted !== 1 ? 's' : ''} waitlisted
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FundingSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Success Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg bg-muted p-4">
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
