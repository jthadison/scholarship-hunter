/**
 * TierSuccessTable Component
 *
 * Table displaying success rates by priority tier:
 * - Tier name (MUST_APPLY, SHOULD_APPLY, IF_TIME_PERMITS, HIGH_VALUE_REACH)
 * - Applications count
 * - Awards count
 * - Success rate with color-coded indicators
 * - Total funding per tier
 * - Sortable columns
 * - Mobile-responsive card layout
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (AC #3)
 * @module components/analytics/TierSuccessTable
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp, TrendingDown } from 'lucide-react'
import { PriorityTier } from '@prisma/client'
import { useState } from 'react'

export interface TierBreakdownData {
  tier: PriorityTier
  applicationsCount: number
  awardsCount: number
  successRate: number // 0.0 to 1.0
  totalFunding: number
}

export interface TierSuccessTableProps {
  data: TierBreakdownData[]
}

type SortColumn = 'tier' | 'applications' | 'awards' | 'successRate' | 'funding'

const tierLabels: Record<PriorityTier, string> = {
  [PriorityTier.MUST_APPLY]: 'Must Apply',
  [PriorityTier.SHOULD_APPLY]: 'Should Apply',
  [PriorityTier.IF_TIME_PERMITS]: 'If Time Permits',
  [PriorityTier.HIGH_VALUE_REACH]: 'High Value Reach',
}

const tierColors: Record<PriorityTier, string> = {
  [PriorityTier.MUST_APPLY]: 'bg-green-100 text-green-800 border-green-300',
  [PriorityTier.SHOULD_APPLY]: 'bg-blue-100 text-blue-800 border-blue-300',
  [PriorityTier.IF_TIME_PERMITS]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [PriorityTier.HIGH_VALUE_REACH]: 'bg-purple-100 text-purple-800 border-purple-300',
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 0.3) return 'text-green-600 font-bold' // >30% green
  if (rate >= 0.15) return 'text-yellow-600 font-semibold' // 15-30% yellow
  return 'text-red-600' // <15% red
}

function getSuccessRateIndicator(rate: number) {
  if (rate >= 0.3) return <TrendingUp className="h-4 w-4 text-green-600 inline ml-1" />
  if (rate >= 0.15) return null
  return <TrendingDown className="h-4 w-4 text-red-600 inline ml-1" />
}

export function TierSuccessTable({ data }: TierSuccessTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('successRate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0
    switch (sortColumn) {
      case 'tier':
        comparison = tierLabels[a.tier].localeCompare(tierLabels[b.tier])
        break
      case 'applications':
        comparison = a.applicationsCount - b.applicationsCount
        break
      case 'awards':
        comparison = a.awardsCount - b.awardsCount
        break
      case 'successRate':
        comparison = a.successRate - b.successRate
        break
      case 'funding':
        comparison = a.totalFunding - b.totalFunding
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const hasData = data.some((tier) => tier.applicationsCount > 0)

  // Calculate insights
  const bestTier = [...data].sort((a, b) => b.successRate - a.successRate)[0]
  const worstTier = [...data]
    .filter((t) => t.applicationsCount > 0)
    .sort((a, b) => a.successRate - b.successRate)[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Success by Priority Tier
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-sm font-medium text-muted-foreground">
                    <th
                      className="text-left p-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('tier')}
                    >
                      Tier {sortColumn === 'tier' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right p-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('applications')}
                    >
                      Applications{' '}
                      {sortColumn === 'applications' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right p-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('awards')}
                    >
                      Awards {sortColumn === 'awards' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right p-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('successRate')}
                    >
                      Success Rate{' '}
                      {sortColumn === 'successRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right p-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('funding')}
                    >
                      Total Funding{' '}
                      {sortColumn === 'funding' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((tier) => (
                    <tr key={tier.tier} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Badge variant="outline" className={tierColors[tier.tier]}>
                          {tierLabels[tier.tier]}
                        </Badge>
                      </td>
                      <td className="text-right p-3 font-medium">
                        {tier.applicationsCount}
                      </td>
                      <td className="text-right p-3 font-medium text-green-600">
                        {tier.awardsCount}
                      </td>
                      <td className={`text-right p-3 ${getSuccessRateColor(tier.successRate)}`}>
                        {tier.applicationsCount > 0
                          ? `${(tier.successRate * 100).toFixed(0)}%`
                          : '—'}
                        {getSuccessRateIndicator(tier.successRate)}
                      </td>
                      <td className="text-right p-3 font-medium text-green-700">
                        ${tier.totalFunding.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {sortedData.map((tier) => (
                <div
                  key={tier.tier}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={tierColors[tier.tier]}>
                      {tierLabels[tier.tier]}
                    </Badge>
                    <span className={`text-2xl font-bold ${getSuccessRateColor(tier.successRate)}`}>
                      {tier.applicationsCount > 0
                        ? `${(tier.successRate * 100).toFixed(0)}%`
                        : '—'}
                      {getSuccessRateIndicator(tier.successRate)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Applications</p>
                      <p className="font-medium">{tier.applicationsCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Awards</p>
                      <p className="font-medium text-green-600">{tier.awardsCount}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Total Funding</p>
                      <p className="font-medium text-green-700">
                        ${tier.totalFunding.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            {bestTier && worstTier && bestTier.tier !== worstTier.tier && (
              <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Insight:</span> Your{' '}
                  <span className="font-bold">{tierLabels[bestTier.tier]}</span> tier has{' '}
                  {bestTier.successRate > 0 && worstTier.successRate > 0
                    ? `${(bestTier.successRate / worstTier.successRate).toFixed(1)}x`
                    : 'significantly'}{' '}
                  higher success rate than{' '}
                  <span className="font-bold">{tierLabels[worstTier.tier]}</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No tier data yet - applications will be categorized by priority tier
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
