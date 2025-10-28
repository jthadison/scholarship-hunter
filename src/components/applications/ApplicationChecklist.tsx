/**
 * ApplicationChecklist Component
 *
 * Displays comprehensive checklist with three requirement categories:
 * - Essays
 * - Documents
 * - Recommendations
 *
 * Features:
 * - Collapsible sections
 * - Interactive navigation to editors
 * - Progress summary per section
 * - Real-time updates via React Query
 *
 * @module components/applications/ApplicationChecklist
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, FileText, Upload, UserCheck } from 'lucide-react'
import { ChecklistItem, ChecklistItemStatus } from './ChecklistItem'
import { cn } from '@/lib/utils'

interface ApplicationChecklistProps {
  /**
   * Application ID
   */
  applicationId: string

  /**
   * Essay requirements
   */
  essays: Array<{
    id: string
    title: string
    wordCount?: number
    status: ChecklistItemStatus
  }>

  /**
   * Document requirements
   */
  documents: Array<{
    id: string
    title: string
    uploaded: boolean
  }>

  /**
   * Recommendation requirements
   */
  recommendations: Array<{
    id: string
    recommender: string
    status: 'PENDING_REQUEST' | 'REQUESTED' | 'RECEIVED' | 'SUBMITTED'
  }>

  /**
   * Progress counts
   */
  progress: {
    essayComplete: number
    essayCount: number
    documentsUploaded: number
    documentsRequired: number
    recsReceived: number
    recsRequired: number
  }

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Collapsible section component
 */
interface SectionProps {
  title: string
  icon: React.ReactNode
  summary: string
  defaultExpanded?: boolean
  children: React.ReactNode
}

function Section({ title, icon, summary, defaultExpanded = true, children }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Section header */}
      <button
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="text-gray-600 dark:text-gray-400">{icon}</div>

          {/* Title and summary */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{summary}</p>
          </div>
        </div>

        {/* Expand/collapse icon */}
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Section content */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">{children}</div>
      )}
    </div>
  )
}

/**
 * Map recommendation status to checklist status
 */
function getRecStatusAsChecklistStatus(
  status: 'PENDING_REQUEST' | 'REQUESTED' | 'RECEIVED' | 'SUBMITTED'
): ChecklistItemStatus {
  if (status === 'RECEIVED' || status === 'SUBMITTED') return 'COMPLETE'
  if (status === 'REQUESTED') return 'IN_PROGRESS'
  return 'NOT_STARTED'
}

export function ApplicationChecklist({
  applicationId,
  essays,
  documents,
  recommendations,
  progress,
  className,
}: ApplicationChecklistProps) {
  const router = useRouter()

  // Essay section summary
  const essaySummary = `${progress.essayComplete} of ${progress.essayCount} complete`

  // Document section summary
  const documentSummary = `${progress.documentsUploaded} of ${progress.documentsRequired} uploaded`

  // Recommendation section summary
  const recSummary = `${progress.recsReceived} of ${progress.recsRequired} received`

  return (
    <div className={cn('space-y-4', className)}>
      {/* Essays Section */}
      {progress.essayCount > 0 && (
        <Section
          title="Essays"
          icon={<FileText className="h-5 w-5" />}
          summary={essaySummary}
          defaultExpanded={true}
        >
          <div className="space-y-1">
            {essays.length > 0 ? (
              essays.map((essay) => (
                <ChecklistItem
                  key={essay.id}
                  title={essay.title}
                  status={essay.status}
                  metadata={essay.wordCount ? `${essay.wordCount} words` : undefined}
                  onClick={() => {
                    router.push(`/applications/${applicationId}/essay/${essay.id}`)
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No essays required</p>
            )}
          </div>
        </Section>
      )}

      {/* Documents Section */}
      {progress.documentsRequired > 0 && (
        <Section
          title="Documents"
          icon={<Upload className="h-5 w-5" />}
          summary={documentSummary}
          defaultExpanded={true}
        >
          <div className="space-y-1">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <ChecklistItem
                  key={doc.id}
                  title={doc.title}
                  status={doc.uploaded ? 'COMPLETE' : 'NOT_STARTED'}
                  onClick={() => {
                    // Open document upload modal
                    // TODO: Implement document upload modal
                    alert('Document upload modal - To be implemented in Story 4.1')
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No documents required</p>
            )}
          </div>
        </Section>
      )}

      {/* Recommendations Section */}
      {progress.recsRequired > 0 && (
        <Section
          title="Recommendations"
          icon={<UserCheck className="h-5 w-5" />}
          summary={recSummary}
          defaultExpanded={true}
        >
          <div className="space-y-1">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <ChecklistItem
                  key={rec.id}
                  title={`Recommendation from ${rec.recommender}`}
                  status={getRecStatusAsChecklistStatus(rec.status)}
                  onClick={() => {
                    // Navigate to recommendation tracking page
                    router.push(`/applications/${applicationId}/recommendations/${rec.id}`)
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recommendations required
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {progress.essayCount === 0 &&
        progress.documentsRequired === 0 &&
        progress.recsRequired === 0 && (
          <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No requirements specified for this application.
            </p>
          </div>
        )}
    </div>
  )
}
