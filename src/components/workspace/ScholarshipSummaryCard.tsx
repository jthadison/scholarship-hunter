/**
 * ScholarshipSummaryCard Component
 *
 * Displays scholarship context including name, provider, award amount,
 * deadline, eligibility summary, and match score.
 *
 * Story 3.8 AC#1: Scholarship details in unified interface
 *
 * @module components/workspace/ScholarshipSummaryCard
 */

'use client'

import React from 'react'
import { ExternalLink, Award, Calendar, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { CollapsibleCard } from './CollapsibleCard'
import { Badge } from '@/components/ui/badge'

interface ScholarshipSummaryCardProps {
  /**
   * Scholarship data
   */
  scholarship: {
    id: string
    name: string
    provider: string
    awardAmount: number | null
    deadline: Date
    category?: string | null
    description?: string | null
    eligibilityCriteria?: any
  }

  /**
   * Match data (if available)
   */
  match?: {
    overallMatchScore: number
    priorityTier: string
  } | null

  /**
   * Whether card is expanded
   */
  isExpanded: boolean

  /**
   * Toggle callback
   */
  onToggle: (id: string) => void

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number | null): string {
  if (!amount) return 'Amount varies'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get priority tier badge color
 */
function getPriorityColor(tier: string): string {
  switch (tier) {
    case 'MUST_APPLY':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'SHOULD_APPLY':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'IF_TIME_PERMITS':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'HIGH_VALUE_REACH':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

/**
 * Format priority tier for display
 */
function formatPriorityTier(tier: string): string {
  return tier
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export function ScholarshipSummaryCard({
  scholarship,
  match,
  isExpanded,
  onToggle,
  className,
}: ScholarshipSummaryCardProps) {
  // Extract top eligibility criteria (simplified - can be enhanced based on actual data structure)
  const eligibilitySummary: string[] = []
  if (scholarship.eligibilityCriteria) {
    // This is a placeholder - actual implementation depends on eligibilityCriteria structure
    // For now, we'll show category as a placeholder
    if (scholarship.category) {
      eligibilitySummary.push(scholarship.category)
    }
  }

  return (
    <CollapsibleCard
      id="summary"
      title="Scholarship Details"
      subtitle={scholarship.provider}
      icon={<Award className="h-5 w-5" />}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-4">
        {/* Award Amount and Match Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Award Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(scholarship.awardAmount)}
            </p>
          </div>
          {match && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Match Score</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(match.overallMatchScore)}%
              </p>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {format(scholarship.deadline, 'MMMM d, yyyy')}
          </span>
        </div>

        {/* Priority Tier */}
        {match?.priorityTier && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
            <Badge className={getPriorityColor(match.priorityTier)}>
              {formatPriorityTier(match.priorityTier)}
            </Badge>
          </div>
        )}

        {/* Eligibility Summary */}
        {eligibilitySummary.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Eligibility Highlights
            </p>
            <div className="space-y-1">
              {eligibilitySummary.slice(0, 3).map((criteria, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">{criteria}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {scholarship.description && (
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </p>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {scholarship.description.length > 300
                ? `${scholarship.description.substring(0, 300)}...`
                : scholarship.description}
            </p>
          </div>
        )}

        {/* View Full Details Link */}
        <div className="pt-2">
          <a
            href={`/scholarships/${scholarship.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Full Scholarship Details
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </CollapsibleCard>
  )
}
