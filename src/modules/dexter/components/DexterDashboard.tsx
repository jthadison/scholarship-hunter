/**
 * Dexter Dashboard - Main Container Component
 *
 * Displays comprehensive document management overview with:
 * - Greeting with Dexter persona and status
 * - Document vault overview
 * - Recent uploads timeline
 * - Proactive warnings
 * - Compliance status by application
 * - Recommendation tracking
 * - Quick actions toolbar
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 2, All ACs)
 */

'use client'

import { trpc } from '@/shared/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { DexterHeader } from './DexterHeader'
import { DocumentVaultOverview } from './DocumentVaultOverview'
import { RecentUploadsTimeline } from './RecentUploadsTimeline'
import { ProactiveWarnings } from './ProactiveWarnings'
import { ComplianceStatusGrid } from './ComplianceStatusGrid'
import { RecommendationStatusPanel } from './RecommendationStatusPanel'
import { QuickActions } from './QuickActions'
import { ComplianceCheckModal } from './ComplianceCheckModal'
import { useState } from 'react'

interface DexterDashboardProps {
  firstName: string
}

export function DexterDashboard({ firstName }: DexterDashboardProps) {
  const [complianceCheckResult, setComplianceCheckResult] = useState<any>(null)
  const [showComplianceModal, setShowComplianceModal] = useState(false)

  // Get student ID from session
  const { data: sessionData, isLoading: studentLoading } = trpc.auth.getSession.useQuery()
  const studentId = sessionData?.student?.id ?? ''

  // Fetch document summary
  const {
    data: documentSummary,
    isLoading: docSummaryLoading,
    error: docSummaryError,
  } = trpc.dexter.getDocumentSummary.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000, // 30 seconds
    }
  )

  // Fetch compliance status
  const {
    data: complianceStatus,
    isLoading: complianceLoading,
    error: complianceError,
  } = trpc.dexter.getComplianceStatus.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Fetch recommendation status
  const {
    data: recommendationStatus,
    isLoading: recommendationLoading,
    error: recommendationError,
  } = trpc.dexter.getRecommendationStatus.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Fetch proactive warnings
  const {
    data: warningsData,
    isLoading: warningsLoading,
    error: warningsError,
  } = trpc.dexter.getProactiveWarnings.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Run compliance check mutation
  const runComplianceCheckMutation = trpc.dexter.runComplianceCheck.useMutation({
    onSuccess: (data) => {
      setComplianceCheckResult(data)
      setShowComplianceModal(true)
    },
  })

  const handleRunComplianceCheck = () => {
    if (studentId) {
      runComplianceCheckMutation.mutate({ studentId })
    }
  }

  const isLoading =
    studentLoading ||
    docSummaryLoading ||
    complianceLoading ||
    recommendationLoading ||
    warningsLoading

  const hasError =
    docSummaryError || complianceError || recommendationError || warningsError

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load Dexter dashboard. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Extract data with defaults
  const totalDocuments = documentSummary?.totalDocs ?? 0
  const criticalWarnings = warningsData?.counts.critical ?? 0
  const compliancePercentage = complianceStatus?.summary.percentageCompliant ?? 0

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Dexter Header */}
      <DexterHeader
        firstName={firstName}
        totalDocuments={totalDocuments}
        criticalWarnings={criticalWarnings}
        compliancePercentage={compliancePercentage}
      />

      {/* Quick Actions */}
      <QuickActions onRunComplianceCheck={handleRunComplianceCheck} />

      {/* Proactive Warnings (Full Width) */}
      {warningsData && (
        <ProactiveWarnings warnings={warningsData.warnings} counts={warningsData.counts} />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Document Vault Overview */}
          {documentSummary && (
            <DocumentVaultOverview
              totalDocs={documentSummary.totalDocs}
              byCategory={documentSummary.byCategory}
              storageUsed={documentSummary.storageUsed}
              storageQuota={documentSummary.storageQuota}
              documentsWithVersions={documentSummary.documentsWithVersions}
            />
          )}

          {/* Recommendation Status */}
          {recommendationStatus && (
            <RecommendationStatusPanel
              total={recommendationStatus.total}
              received={recommendationStatus.received}
              pending={recommendationStatus.pending}
              overdue={recommendationStatus.overdue}
              pendingList={recommendationStatus.pendingList}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Uploads Timeline */}
          {documentSummary && (
            <RecentUploadsTimeline uploads={documentSummary.recentUploads} />
          )}

          {/* Compliance Status Grid */}
          {complianceStatus && (
            <ComplianceStatusGrid
              applications={complianceStatus.applications}
              summary={complianceStatus.summary}
            />
          )}
        </div>
      </div>

      {/* Compliance Check Modal */}
      <ComplianceCheckModal
        open={showComplianceModal}
        onOpenChange={setShowComplianceModal}
        result={complianceCheckResult}
      />
    </div>
  )
}
