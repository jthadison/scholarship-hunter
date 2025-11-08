/**
 * ApplicationWorkspace Component
 *
 * Unified workspace interface for managing single scholarship application.
 * Consolidates scholarship context, progress, timeline, tasks, and actions
 * into one comprehensive view.
 *
 * Story 3.8: Application Workspace - Unified Interface
 *
 * @module components/workspace/ApplicationWorkspace
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/shared/lib/trpc'
import { WorkspaceHeader } from './WorkspaceHeader'
import { ScholarshipSummaryCard } from './ScholarshipSummaryCard'
import { TimelineMilestonesCard } from './TimelineMilestonesCard'
import { ApplicationChecklist } from '@/components/applications/ApplicationChecklist'
import { EssaySectionCard, DocumentSectionCard, RecommendationSectionCard } from './TaskSectionCards'
import { ApplicationNotes } from './ApplicationNotes'
import { QuickActionButtons } from './QuickActionButtons'
import { CollapsibleCard } from './CollapsibleCard'
import { useCollapsibleSections } from '@/hooks/useCollapsibleSections'
import { useWorkspaceModalStore } from '@/stores/workspaceModalStore'
import { EssayCreateModal } from './modals/EssayCreateModal'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Maximize, Minimize } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

interface ApplicationWorkspaceProps {
  /**
   * Application ID
   */
  applicationId: string
}

export function ApplicationWorkspace({ applicationId }: ApplicationWorkspaceProps) {
  const router = useRouter()
  const { userId } = useAuth()
  const { activeModal, openModal, closeModal } = useWorkspaceModalStore()

  // Fetch workspace data
  const { data: workspace, isLoading, error } = trpc.application.getWorkspaceData.useQuery({
    applicationId,
  })

  // Refetch workspace data after modal actions
  const utils = trpc.useUtils()
  const handleModalSuccess = () => {
    utils.application.getWorkspaceData.invalidate({ applicationId })
  }

  // Collapsible sections state
  const { isExpanded, toggleSection, collapseAll, expandAll } = useCollapsibleSections(
    userId || 'anonymous',
    applicationId
  )

  // Status update mutation
  const updateStatus = trpc.application.updateStatus.useMutation({
    onSuccess: () => {
      utils.application.getWorkspaceData.invalidate({ applicationId })
      toast.success('Application status updated')
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`)
    },
  })

  // Notes update mutation
  const updateNotes = trpc.application.updateNotes.useMutation({
    onError: (error: any) => {
      toast.error(`Failed to save notes: ${error.message}`)
      throw error // Re-throw to trigger error state in ApplicationNotes
    },
  })

  // Handle status change
  const handleStatusChange = async (newStatus: any) => {
    await updateStatus.mutateAsync({
      applicationId,
      status: newStatus,
    })
  }

  // Handle notes save
  const handleNotesSave = async (notes: string) => {
    await updateNotes.mutateAsync({
      applicationId,
      notes,
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {error?.message || 'Failed to load application workspace'}
          </p>
          <Button onClick={() => router.push('/applications')} className="mt-4">
            Back to Applications
          </Button>
        </div>
      </div>
    )
  }

  // Prepare data for components
  const progress = {
    essayComplete: workspace.essayComplete,
    essayCount: workspace.essayCount,
    documentsUploaded: workspace.documentsUploaded,
    documentsRequired: workspace.documentsRequired,
    recsReceived: workspace.recsReceived,
    recsRequired: workspace.recsRequired,
    progressPercentage: workspace.progressPercentage,
  }

  // Transform essays for ApplicationChecklist
  const essaysForChecklist = workspace.essays.map((essay: any) => ({
    id: essay.id,
    title: essay.title,
    wordCount: essay.wordCount || undefined,
    status: essay.phase as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE',
  }))

  // Transform documents for ApplicationChecklist
  const documentsForChecklist = workspace.documents.map((doc: any) => ({
    id: doc.id,
    title: doc.type,
    uploaded: !!doc.createdAt,
  }))

  // Transform recommendations for ApplicationChecklist
  const recommendationsForChecklist = workspace.recommendations.map((rec: any) => ({
    id: rec.id,
    recommender: rec.name,
    status: rec.status as 'PENDING_REQUEST' | 'REQUESTED' | 'RECEIVED' | 'SUBMITTED',
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <WorkspaceHeader
        scholarshipName={workspace.scholarship.name}
        status={workspace.status}
        deadline={workspace.scholarship.deadline}
        progress={progress}
        applicationId={applicationId}
        onStatusChange={handleStatusChange}
        isUpdating={updateStatus.isPending}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        {/* Collapse/Expand All Button */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const allExpanded = Object.values(isExpanded).every((val) => val)
              allExpanded ? collapseAll() : expandAll()
            }}
          >
            {Object.values(isExpanded).every((val) => val) ? (
              <>
                <Minimize className="mr-2 h-4 w-4" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize className="mr-2 h-4 w-4" />
                Expand All
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions - Desktop */}
        <div className="mb-6 hidden md:block">
          <QuickActionButtons variant="inline" />
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Summary & Progress */}
          <div className="space-y-6 lg:col-span-1">
            <ScholarshipSummaryCard
              scholarship={workspace.scholarship}
              match={workspace.match}
              isExpanded={isExpanded('summary')}
              onToggle={toggleSection}
            />

            <CollapsibleCard
              id="progress"
              title="Application Progress"
              subtitle={`${Math.round(workspace.progressPercentage)}% complete`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              isExpanded={isExpanded('progress')}
              onToggle={toggleSection}
            >
              <ApplicationChecklist
                applicationId={applicationId}
                essays={essaysForChecklist}
                documents={documentsForChecklist}
                recommendations={recommendationsForChecklist}
                progress={progress}
              />
            </CollapsibleCard>
          </div>

          {/* Middle Column - Tasks */}
          <div className="space-y-6 lg:col-span-1">
            <EssaySectionCard
              essays={workspace.essays}
              essayCount={workspace.essayCount}
              essayComplete={workspace.essayComplete}
              isExpanded={isExpanded('essays')}
              onToggle={toggleSection}
              onStartEssay={() => openModal('essay')}
              onEditEssay={(essayId) => router.push(`/dashboard/essays/${essayId}`)}
            />

            <DocumentSectionCard
              documents={workspace.documents}
              documentsRequired={workspace.documentsRequired}
              documentsUploaded={workspace.documentsUploaded}
              isExpanded={isExpanded('documents')}
              onToggle={toggleSection}
              onUploadDocument={(_category) => toast.info('Document upload - Story 4.1')}
              onDownloadDocument={(_docId) => toast.info('Download functionality - Story 4.1')}
            />

            <RecommendationSectionCard
              recommendations={workspace.recommendations}
              recsRequired={workspace.recsRequired}
              recsReceived={workspace.recsReceived}
              isExpanded={isExpanded('recommendations')}
              onToggle={toggleSection}
              onRequestRecommendation={() => toast.info('Recommendation request - Story 4.4')}
              onSendReminder={(_recId) => toast.info('Reminder functionality - Story 4.4')}
            />
          </div>

          {/* Right Column - Timeline & Notes */}
          <div className="space-y-6 lg:col-span-1">
            <TimelineMilestonesCard
              timeline={workspace.timeline}
              progress={progress}
              isExpanded={isExpanded('timeline')}
              onToggle={toggleSection}
            />

            <ApplicationNotes
              applicationId={applicationId}
              initialNotes={workspace.notes}
              onSave={handleNotesSave}
              isExpanded={isExpanded('notes')}
              onToggle={toggleSection}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions FAB - Mobile */}
      <QuickActionButtons variant="fab" />

      {/* Modals */}
      {activeModal === 'essay' && workspace.studentId && (() => {
        // Debug: Log studentId before rendering modal
        console.log('[ApplicationWorkspace] Rendering EssayCreateModal with studentId:', {
          studentId: workspace.studentId,
          type: typeof workspace.studentId,
          length: workspace.studentId?.length,
          isValidFormat: /^c[a-z0-9]{24}$/i.test(workspace.studentId),
        });
        return (
          <EssayCreateModal
            isOpen={true}
            onClose={closeModal}
            applicationId={applicationId}
            studentId={workspace.studentId}
            onSuccess={() => {
              console.log('Essay created successfully, workspace.studentId:', workspace.studentId)
              handleModalSuccess()
            }}
          />
        );
      })()}

      {/* TODO: Document and recommendation modals will be added in Epic 4 */}
    </div>
  )
}
