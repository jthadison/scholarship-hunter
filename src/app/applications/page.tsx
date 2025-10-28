/**
 * Applications Dashboard Page (Story 3.3 - Full Kanban Board)
 *
 * Displays student's scholarship applications in a Kanban board layout with:
 * - 4 columns: BACKLOG, TODO, IN_PROGRESS, SUBMITTED
 * - Drag-and-drop functionality (desktop only)
 * - Mobile-responsive vertical list (mobile)
 * - Filter controls (priority tier, deadline range, status)
 * - At-risk application banner
 * - Real-time status updates with optimistic UI
 *
 * @page /applications
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/shared/lib/trpc'
import { Loader2, Plus, Home, ChevronRight, AlertTriangle, CheckSquare, Archive } from 'lucide-react'
import { KanbanBoard } from '@/components/applications/KanbanBoard'
import { MobileList } from '@/components/applications/MobileList'
import { FilterBar, type FilterState } from '@/components/applications/FilterBar'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { getAtRiskCount } from '@/lib/utils/application'
import { differenceInDays } from 'date-fns'
import type { ApplicationStatus } from '@prisma/client'
import { BulkActionsToolbar } from '@/components/applications/BulkActionsToolbar' // Story 3.9
import { useSelectionStore } from '@/stores/useSelectionStore' // Story 3.9

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, isLoaded: isUserLoaded } = useUser()
  const { toast } = useToast()

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    priorityTiers: [],
    deadlineRange: 'all',
    statuses: [],
  })

  // Story 3.9: Bulk selection state
  const [showBulkSelection, setShowBulkSelection] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { clearSelection, selectAll } = useSelectionStore()

  // Fetch applications using new getByStudent query (Story 3.9: conditionally show archived)
  const {
    data: applications,
    isLoading,
    refetch,
  } = trpc.application.getByStudent.useQuery(undefined, {
    enabled: !!user && !showArchived,
  })

  // Story 3.9: Fetch archived applications
  const {
    data: archivedApplications,
    isLoading: isLoadingArchived,
    refetch: refetchArchived,
  } = trpc.application.getArchived.useQuery(undefined, {
    enabled: !!user && showArchived,
  })

  // Choose which dataset to show - use proper type narrowing
  const displayedApplications = showArchived
    ? (archivedApplications ?? [])
    : (applications ?? [])

  // Update status mutation
  const updateStatusMutation = trpc.application.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: 'Status updated',
        description: 'Application status has been updated successfully.',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Apply filters (must be called before early returns per React Hooks rules)
  const filteredApplications = useMemo(() => {
    if (!displayedApplications) return []

    return displayedApplications.filter((app) => {
      // Priority tier filter
      if (
        filters.priorityTiers.length > 0 &&
        app.priorityTier &&
        !filters.priorityTiers.includes(app.priorityTier)
      ) {
        return false
      }

      // Deadline range filter
      if (filters.deadlineRange !== 'all') {
        const daysUntilDeadline = differenceInDays(
          new Date(app.scholarship.deadline),
          new Date()
        )

        switch (filters.deadlineRange) {
          case 'next_7_days':
            if (daysUntilDeadline > 7) return false
            break
          case 'next_30_days':
            if (daysUntilDeadline > 30) return false
            break
          case 'next_90_days':
            if (daysUntilDeadline > 90) return false
            break
        }
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) {
        return false
      }

      return true
    })
  }, [displayedApplications, filters])

  // Calculate at-risk count
  const atRiskCount = filteredApplications ? getAtRiskCount(filteredApplications) : 0

  // Require authentication
  if (isUserLoaded && !user) {
    router.push('/sign-in')
    return null
  }

  // Loading state
  const loading = isLoading || isLoadingArchived || !isUserLoaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  // Story 3.9: Toggle bulk selection mode
  const toggleBulkSelection = () => {
    if (showBulkSelection) {
      clearSelection()
    }
    setShowBulkSelection(!showBulkSelection)
  }

  // Story 3.9: Toggle archived view
  const toggleArchivedView = () => {
    clearSelection()
    setShowArchived(!showArchived)
    setShowBulkSelection(false)
  }

  // Story 3.9: Handle select all
  const handleSelectAll = () => {
    if (filteredApplications) {
      selectAll(filteredApplications.map(app => app.id))
    }
  }

  // Story 3.9: Handle bulk action complete
  const handleBulkActionComplete = () => {
    refetch()
    refetchArchived()
  }

  /**
   * Handle status change
   */
  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    await updateStatusMutation.mutateAsync({
      applicationId,
      status: newStatus,
    })
  }

  /**
   * Handle at-risk banner click
   */
  const handleAtRiskClick = () => {
    // Filter to show only at-risk applications
    setFilters({
      priorityTiers: [],
      deadlineRange: 'next_7_days',
      statuses: [],
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">My Applications</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {showArchived ? 'Archived Applications' : 'My Applications'}
            </h1>
            <p className="text-gray-600 mt-1">
              {showArchived
                ? 'View and manage archived applications'
                : 'Track and manage your scholarship applications'}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Story 3.9: Bulk Selection Toggle */}
            {!showArchived && filteredApplications.length > 0 && (
              <Button
                variant={showBulkSelection ? 'default' : 'outline'}
                onClick={toggleBulkSelection}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {showBulkSelection ? 'Cancel Selection' : 'Select Multiple'}
              </Button>
            )}
            {/* Story 3.9: Select All Button */}
            {showBulkSelection && (
              <Button variant="outline" onClick={handleSelectAll}>
                Select All ({filteredApplications.length})
              </Button>
            )}
            {/* Story 3.9: View Archived Toggle */}
            <Button variant="outline" onClick={toggleArchivedView}>
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'View Active' : 'View Archived'}
            </Button>
            {/* Add Scholarship Button */}
            {!showArchived && (
              <Button onClick={() => router.push('/scholarships/search')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Scholarship
              </Button>
            )}
          </div>
        </div>

        {/* Story 3.9: Bulk Actions Toolbar */}
        {showBulkSelection && <BulkActionsToolbar onActionComplete={handleBulkActionComplete} />}

        {/* At-Risk Banner (AC5) */}
        {atRiskCount > 0 && (
          <button
            onClick={handleAtRiskClick}
            className="w-full mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-semibold text-red-900">
                ⚠️ {atRiskCount} {atRiskCount === 1 ? 'application' : 'applications'} need
                attention
              </p>
              <p className="text-sm text-red-700">
                These applications have deadlines in less than 7 days and are less than 50%
                complete. Click to view.
              </p>
            </div>
          </button>
        )}

        {/* Filter Bar (AC6) */}
        <div className="mb-6">
          <FilterBar onFilterChange={setFilters} activeFilters={filters} />
        </div>

        {/* Applications View */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {applications && applications.length > 0
                ? 'No applications match your filters'
                : 'No applications yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {applications && applications.length > 0
                ? 'Try adjusting your filters or clear them to see all applications'
                : 'Start by adding scholarships from the search page'}
            </p>
            {(!applications || applications.length === 0) && (
              <Button onClick={() => router.push('/scholarships/search')}>
                <Plus className="h-4 w-4 mr-2" />
                Browse Scholarships
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: Kanban Board (AC1, AC3) */}
            <div className="hidden lg:block">
              <KanbanBoard
                applications={filteredApplications}
                onStatusChange={handleStatusChange}
                showCheckbox={showBulkSelection}
              />
            </div>

            {/* Mobile: Vertical List (AC7) */}
            <div className="lg:hidden">
              <MobileList
                applications={filteredApplications}
                onStatusChange={handleStatusChange}
                showCheckbox={showBulkSelection}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
