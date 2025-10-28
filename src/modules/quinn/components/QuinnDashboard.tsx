/**
 * Quinn Dashboard - Main Container Component (Story 3.6 - Task 7)
 *
 * Quinn is the Timeline Coordinator agent who helps students manage deadlines
 * and optimize workload distribution.
 *
 * Main dashboard displays:
 * - Personalized greeting with Quinn avatar
 * - This Week's Tasks (organized by urgency)
 * - Workload Visualization (hours breakdown)
 * - Conflict Warnings (if any)
 * - Capacity Suggestions (when available)
 * - Calendar Export
 *
 * @component
 */

'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { QuinnHeader } from './QuinnHeader'
import { WeeklyTaskList } from './WeeklyTaskList'
import { WorkloadVisualization } from './WorkloadVisualization'
import { CapacitySuggestions } from './CapacitySuggestions'
import { CalendarExport } from './CalendarExport'
import { useRouter } from 'next/navigation'
import { useToast } from '@/shared/hooks/use-toast'

interface QuinnDashboardProps {
  firstName: string
}

export function QuinnDashboard({ firstName }: QuinnDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false)

  // Get student ID from session
  const { data: sessionData, isLoading: studentLoading } = trpc.auth.getSession.useQuery()
  const studentId = sessionData?.student?.id ?? ''

  // Fetch weekly tasks (AC#1)
  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = trpc.quinn.getWeeklyTasks.useQuery(undefined, {
    enabled: !!studentId,
    staleTime: 30000,
  })

  // Fetch workload summary (AC#2)
  const {
    data: workloadData,
    isLoading: workloadLoading,
  } = trpc.quinn.getWorkloadSummary.useQuery(undefined, {
    enabled: !!studentId,
    staleTime: 30000,
  })

  // Fetch conflict warnings (AC#3)
  const {
    data: conflictsData,
    isLoading: conflictsLoading,
  } = trpc.timeline.detectConflicts.useQuery(
    { studentId },
    {
      enabled: !!studentId,
      staleTime: 30000,
    }
  )

  // Fetch capacity suggestion (AC#4)
  const {
    data: capacityData,
    isLoading: capacityLoading,
  } = trpc.quinn.getCapacitySuggestion.useQuery(undefined, {
    enabled: !!studentId && !dismissedSuggestion,
    staleTime: 30000,
  })

  // Fetch applications for calendar export (AC#5)
  const {
    data: calendarData,
    isLoading: calendarLoading,
  } = trpc.timeline.getCalendarView.useQuery(
    {},
    {
      enabled: !!studentId,
      staleTime: 60000,
    }
  )

  // Mark task complete mutation
  const markTaskCompleteMutation = trpc.quinn.markTaskComplete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Task Marked Complete',
        description: 'Great progress! Keep it up.',
      })
      refetchTasks()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Update application status mutation (for "Start Application")
  const updateStatusMutation = trpc.application.updateStatus.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Application Started',
        description: `You're now working on ${data.scholarship.name}!`,
      })
      router.push(`/applications/${data.id}`)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Handlers
  const handleTaskClick = (task: any) => {
    router.push(`/applications/${task.applicationId}`)
  }

  const handleMarkComplete = (taskId: string, taskType: any) => {
    markTaskCompleteMutation.mutate({ taskId, taskType })
  }

  const handleStartApplication = (applicationId: string) => {
    updateStatusMutation.mutate({
      applicationId,
      status: 'IN_PROGRESS',
    })
  }

  const handleDismissSuggestion = () => {
    setDismissedSuggestion(true)
  }

  const isLoading =
    studentLoading ||
    tasksLoading ||
    workloadLoading ||
    conflictsLoading ||
    capacityLoading ||
    calendarLoading

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load Quinn dashboard. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const tasks = tasksData || []
  const totalHours = workloadData?.totalHours || 0
  const conflicts = conflictsData || { hasConflicts: false, conflictedWeeks: [], totalConflictedApplications: 0 }
  const capacity = capacityData || { hasCapacity: false, currentWeeklyHours: 0, suggestedApplication: null }
  const calendarApps = calendarData || []

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with greeting and avatar */}
      <QuinnHeader
        firstName={firstName}
        tasksThisWeek={tasks.length}
        totalHoursScheduled={totalHours}
      />

      {/* Main Content - Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* This Week's Tasks (AC#1) */}
          <WeeklyTaskList
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onMarkComplete={handleMarkComplete}
          />

          {/* Calendar Export (AC#5) */}
          <CalendarExport
            applications={calendarApps}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Workload Visualization (AC#2) */}
          <WorkloadVisualization
            totalHours={workloadData?.totalHours || 0}
            breakdown={workloadData?.breakdown || []}
            status={workloadData?.status || 'LIGHT'}
            message={workloadData?.message || ''}
          />

          {/* Conflict Warnings (AC#3) - Temporarily simplified */}
          {conflicts.hasConflicts && (
            <Alert variant="destructive" className="bg-orange-50 border-orange-300">
              <AlertCircle className="h-4 w-4 text-orange-700" />
              <AlertDescription className="text-orange-900">
                ⚠️ Warning: {conflicts.conflictedWeeks.length} week{conflicts.conflictedWeeks.length > 1 ? 's' : ''} have excessive workload. Consider deferring lower-priority applications.
              </AlertDescription>
            </Alert>
          )}

          {/* Capacity Suggestions (AC#4) */}
          {!dismissedSuggestion && capacity.suggestedApplication && (
            <CapacitySuggestions
              hasCapacity={capacity.hasCapacity}
              currentWeeklyHours={capacity.currentWeeklyHours}
              suggestedApplication={{
                ...capacity.suggestedApplication,
                estimatedHours: capacity.suggestedApplication.estimatedHours ?? undefined
              }}
              onStartApplication={handleStartApplication}
              onDismiss={handleDismissSuggestion}
            />
          )}
        </div>
      </div>
    </div>
  )
}
