/**
 * Task Section Cards (Essays, Documents, Recommendations)
 *
 * Display task sections with status indicators and quick actions.
 *
 * Story 3.8 AC#1: Task sections organized by type
 *
 * @module components/workspace/TaskSectionCards
 */

'use client'

import React from 'react'
import { FileText, Upload, UserCheck, Plus, Edit, Download, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { CollapsibleCard } from './CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// Essay Section
// ============================================================================

interface EssaySectionCardProps {
  essays: Array<{
    id: string
    title: string
    wordCount?: number | null
    phase: string
    updatedAt?: Date | null
  }>
  essayCount: number
  essayComplete: number
  isExpanded: boolean
  onToggle: (id: string) => void
  onStartEssay: () => void
  onEditEssay: (essayId: string) => void
  className?: string
}

function getEssayPhaseColor(phase: string): string {
  switch (phase) {
    case 'COMPLETE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'OUTLINE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

export function EssaySectionCard({
  essays,
  essayCount,
  essayComplete,
  isExpanded,
  onToggle,
  onStartEssay,
  onEditEssay,
  className,
}: EssaySectionCardProps) {
  return (
    <CollapsibleCard
      id="essays"
      title="Essays"
      subtitle={`${essayComplete} of ${essayCount} complete`}
      icon={<FileText className="h-5 w-5" />}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-3">
        {essays.length > 0 ? (
          <>
            {essays.map((essay) => (
              <div
                key={essay.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {essay.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Badge className={getEssayPhaseColor(essay.phase)}>
                      {essay.phase.toLowerCase()}
                    </Badge>
                    {essay.wordCount && <span>{essay.wordCount} words</span>}
                    {essay.updatedAt && (
                      <span>Last edited {format(essay.updatedAt, 'MMM d')}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditEssay(essay.id)}
                  className="ml-2"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {essay.phase === 'NOT_STARTED' ? 'Start' : 'Continue'}
                </Button>
              </div>
            ))}
            <Button onClick={onStartEssay} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Essay
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No essays required for this scholarship
            </p>
            <Button onClick={onStartEssay} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Optional Essay
            </Button>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

// ============================================================================
// Document Section
// ============================================================================

interface DocumentSectionCardProps {
  documents: Array<{
    id: string
    type: string
    fileName?: string | null
    fileSize?: number | null
    createdAt?: Date | null
    compliant?: boolean | null
  }>
  documentsRequired: number
  documentsUploaded: number
  isExpanded: boolean
  onToggle: (id: string) => void
  onUploadDocument: (category?: string) => void
  onDownloadDocument: (documentId: string) => void
  className?: string
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function DocumentSectionCard({
  documents,
  documentsRequired,
  documentsUploaded,
  isExpanded,
  onToggle,
  onUploadDocument,
  onDownloadDocument,
  className,
}: DocumentSectionCardProps) {
  return (
    <CollapsibleCard
      id="documents"
      title="Documents"
      subtitle={`${documentsUploaded} of ${documentsRequired} uploaded`}
      icon={<Upload className="h-5 w-5" />}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-3">
        {documents.length > 0 ? (
          <>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {doc.type}
                  </p>
                  {doc.fileName ? (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>{doc.fileName}</span>
                      {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                      {doc.createdAt && (
                        <span>Uploaded {format(doc.createdAt, 'MMM d')}</span>
                      )}
                      {doc.compliant && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Compliant
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Not uploaded</p>
                  )}
                </div>
                <div className="ml-2 flex gap-2">
                  {doc.fileName ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadDocument(doc.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUploadDocument(doc.type)}
                      >
                        Replace
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUploadDocument(doc.type)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button onClick={() => onUploadDocument()} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Document
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No documents required for this scholarship
            </p>
            <Button onClick={() => onUploadDocument()} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Optional Document
            </Button>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

// ============================================================================
// Recommendation Section
// ============================================================================

interface RecommendationSectionCardProps {
  recommendations: Array<{
    id: string
    name: string
    email: string
    status: string
    createdAt?: Date | null
    submittedAt?: Date | null
  }>
  recsRequired: number
  recsReceived: number
  isExpanded: boolean
  onToggle: (id: string) => void
  onRequestRecommendation: () => void
  onSendReminder: (recId: string) => void
  className?: string
}

function getRecStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'REQUESTED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'PENDING_REQUEST':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
}

export function RecommendationSectionCard({
  recommendations,
  recsRequired,
  recsReceived,
  isExpanded,
  onToggle,
  onRequestRecommendation,
  onSendReminder,
  className,
}: RecommendationSectionCardProps) {
  return (
    <CollapsibleCard
      id="recommendations"
      title="Recommendations"
      subtitle={`${recsReceived} of ${recsRequired} received`}
      icon={<UserCheck className="h-5 w-5" />}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-3">
        {recommendations.length > 0 ? (
          <>
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rec.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{rec.email}</span>
                    <Badge className={getRecStatusColor(rec.status)}>
                      {rec.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                    {rec.submittedAt && (
                      <span>Submitted {format(rec.submittedAt, 'MMM d')}</span>
                    )}
                    {rec.createdAt && !rec.submittedAt && (
                      <span>Requested {format(rec.createdAt, 'MMM d')}</span>
                    )}
                  </div>
                </div>
                {rec.status === 'REQUESTED' && !rec.submittedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendReminder(rec.id)}
                    className="ml-2"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Remind
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={onRequestRecommendation} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Request Another Recommendation
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No recommendations required for this scholarship
            </p>
            <Button onClick={onRequestRecommendation} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Request Optional Recommendation
            </Button>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}
