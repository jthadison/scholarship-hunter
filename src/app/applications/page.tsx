/**
 * Applications Dashboard Page (Sprint 1 Stub)
 *
 * Displays student's scholarship applications in a simple grid layout.
 * Features:
 * - Status filter tabs (All, TODO, IN_PROGRESS, SUBMITTED)
 * - Application cards with scholarship info, deadline, progress
 * - Mobile-responsive grid layout
 *
 * Sprint 2 Enhancement (Story 3.3):
 * - Full Kanban board with drag-and-drop
 * - Advanced filters (priority tier, deadline range)
 * - Visual at-risk indicators
 *
 * @page /applications
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/shared/lib/trpc'
import { Loader2, Plus, Home, ChevronRight } from 'lucide-react'
import { ApplicationCard } from '@/components/applications/ApplicationCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

type StatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'SUBMITTED'

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  // Fetch applications with optional status filter
  const { data: applications, isLoading } = trpc.application.list.useQuery(
    statusFilter !== 'ALL'
      ? {
          status: statusFilter,
        }
      : undefined,
    {
      enabled: !!user,
    }
  )

  // Require authentication
  if (isUserLoaded && !user) {
    router.push('/sign-in')
    return null
  }

  // Loading state
  if (isLoading || !isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  // Filter applications by status (client-side backup)
  const filteredApplications = applications || []

  // Count by status for badge
  const statusCounts = {
    ALL: applications?.length || 0,
    TODO: applications?.filter((app) => app.status === 'TODO').length || 0,
    IN_PROGRESS:
      applications?.filter((app) => app.status === 'IN_PROGRESS').length || 0,
    SUBMITTED: applications?.filter((app) => app.status === 'SUBMITTED').length || 0,
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your scholarship applications
            </p>
          </div>
          <Button onClick={() => router.push('/scholarships/search')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Scholarship
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(value: string) => setStatusFilter(value as StatusFilter)}
          className="mb-6"
        >
          <TabsList className="grid w-full sm:w-auto grid-cols-4 sm:grid-cols-4">
            <TabsTrigger value="ALL" className="gap-2">
              All <span className="text-xs">({statusCounts.ALL})</span>
            </TabsTrigger>
            <TabsTrigger value="TODO" className="gap-2">
              To Do <span className="text-xs">({statusCounts.TODO})</span>
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" className="gap-2">
              In Progress <span className="text-xs">({statusCounts.IN_PROGRESS})</span>
            </TabsTrigger>
            <TabsTrigger value="SUBMITTED" className="gap-2">
              Submitted <span className="text-xs">({statusCounts.SUBMITTED})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter === 'ALL'
                ? 'No applications yet'
                : `No ${statusFilter.toLowerCase().replace('_', ' ')} applications`}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'ALL'
                ? 'Start by adding scholarships from the search page'
                : 'Try selecting a different status filter'}
            </p>
            {statusFilter === 'ALL' && (
              <Button onClick={() => router.push('/scholarships/search')}>
                <Plus className="h-4 w-4 mr-2" />
                Browse Scholarships
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}

        {/* Sprint 2 Notice */}
        {filteredApplications.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Coming in Sprint 2 (Story 3.3):</strong> Kanban board with
              drag-and-drop, advanced filters, and visual at-risk indicators.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
