/**
 * Effort Breakdown Component
 *
 * Displays detailed requirements checklist showing essays, documents,
 * and recommendation letters needed for scholarship application (Story 2.6).
 *
 * @module components/matching/EffortBreakdown
 */

import React from 'react'
import { FileText, FileCheck, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface EffortBreakdownProps {
  /** Number of essays required */
  essayCount: number
  /** Number of documents required */
  documentCount: number
  /** Number of recommendation letters required */
  recommendationCount: number
  /** Overall effort level */
  effortLevel: EffortLevel
  /** Essay prompts details (optional) */
  essayDetails?: Array<{ wordCount?: number; prompt?: string }>
  /** Document types (optional) */
  documentTypes?: string[]
  /** Additional CSS classes */
  className?: string
}

/**
 * Get effort level color and label
 */
function getEffortLevelInfo(level: EffortLevel) {
  switch (level) {
    case 'LOW':
      return {
        label: 'Low Effort',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        timeRange: '2-3 hours',
      }
    case 'MEDIUM':
      return {
        label: 'Medium Effort',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        timeRange: '4-6 hours',
      }
    case 'HIGH':
      return {
        label: 'High Effort',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        timeRange: '8+ hours',
      }
  }
}

/**
 * Effort Breakdown
 *
 * Shows application requirements with estimated time (AC #2, #4).
 *
 * @example
 * ```tsx
 * <EffortBreakdown
 *   essayCount={2}
 *   documentCount={3}
 *   recommendationCount={1}
 *   effortLevel="MEDIUM"
 *   essayDetails={[
 *     { wordCount: 500, prompt: "Why do you deserve this scholarship?" },
 *     { wordCount: 750, prompt: "Describe your career goals" }
 *   ]}
 *   documentTypes={['transcript', 'resume', 'financial aid form']}
 * />
 * ```
 */
export function EffortBreakdown({
  essayCount,
  documentCount,
  recommendationCount,
  effortLevel,
  essayDetails,
  documentTypes,
  className,
}: EffortBreakdownProps) {
  const effortInfo = getEffortLevelInfo(effortLevel)
  const totalRequirements = essayCount + documentCount + recommendationCount

  return (
    <div className={cn('space-y-4', className)}>
      {/* Effort Level Summary */}
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border p-3',
          effortInfo.bgColor,
          'border-current'
        )}
      >
        <div>
          <h3 className={cn('text-sm font-semibold', effortInfo.color)}>{effortInfo.label}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Estimated time: {effortInfo.timeRange}
          </p>
        </div>
        <div className={cn('text-2xl font-bold', effortInfo.color)}>{totalRequirements}</div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Application Requirements:
        </h4>

        {/* Essays */}
        {essayCount > 0 && (
          <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {essayCount} Essay{essayCount > 1 ? 's' : ''} Required
              </span>
            </div>
            {essayDetails && essayDetails.length > 0 && (
              <ul className="ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {essayDetails.map((essay, index) => (
                  <li key={index} className="list-disc">
                    {essay.wordCount && `${essay.wordCount} words`}
                    {essay.prompt && `: ${essay.prompt.substring(0, 60)}${essay.prompt.length > 60 ? '...' : ''}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Documents */}
        {documentCount > 0 && (
          <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {documentCount} Document{documentCount > 1 ? 's' : ''} Required
              </span>
            </div>
            {documentTypes && documentTypes.length > 0 && (
              <ul className="ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {documentTypes.map((docType, index) => (
                  <li key={index} className="list-disc capitalize">
                    {docType.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Recommendations */}
        {recommendationCount > 0 && (
          <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {recommendationCount} Recommendation Letter{recommendationCount > 1 ? 's' : ''}{' '}
                Needed
              </span>
            </div>
            <p className="ml-6 text-sm text-gray-600 dark:text-gray-400">
              Plan ahead - recommendation letters typically require 2-3 weeks lead time
            </p>
          </div>
        )}

        {/* No Requirements */}
        {totalRequirements === 0 && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-center dark:border-green-700 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-300">
              ✓ Minimal requirements - quick application!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact Effort Summary
 *
 * One-line summary of application requirements
 */
export function EffortSummary({
  essayCount,
  documentCount,
  recommendationCount,
  className,
}: Omit<EffortBreakdownProps, 'effortLevel'>) {
  const parts: string[] = []

  if (essayCount > 0) {
    parts.push(`${essayCount} essay${essayCount > 1 ? 's' : ''}`)
  }
  if (documentCount > 0) {
    parts.push(`${documentCount} doc${documentCount > 1 ? 's' : ''}`)
  }
  if (recommendationCount > 0) {
    parts.push(`${recommendationCount} rec${recommendationCount > 1 ? 's' : ''}`)
  }

  const text = parts.length > 0 ? parts.join(', ') : 'no requirements'

  return (
    <span className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>{text}</span>
  )
}
