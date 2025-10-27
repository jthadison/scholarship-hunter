/**
 * MobileList Component (Story 3.3 - Mobile View)
 *
 * Vertical list view of applications organized by status with collapsible sections.
 * Features:
 * - Collapsible sections for each status
 * - Status dropdown menu for changing status (no drag-and-drop on mobile)
 * - Application cards optimized for mobile
 *
 * @component
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import { ColumnHeader } from './ColumnHeader'
import { cn } from '@/lib/utils'
import {
  groupByStatus,
  type ColumnStatus,
  getStatusText,
} from '@/lib/utils/application'
import type { Application, Scholarship, Timeline, ApplicationStatus } from '@prisma/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type ApplicationWithRelations = Application & {
  scholarship: Pick<Scholarship, 'name' | 'provider' | 'awardAmount' | 'deadline' | 'category' | 'tags'>
  timeline: Timeline | null
}

interface MobileListProps {
  applications: ApplicationWithRelations[]
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>
}

/**
 * Collapsible Section Component
 */
function CollapsibleSection({
  status,
  applications,
  children,
  defaultOpen = true,
}: {
  status: ColumnStatus
  applications: ApplicationWithRelations[]
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <ColumnHeader status={status} count={applications.length} className="mb-0" />
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {applications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No applications
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Application Card with Status Dropdown (Mobile)
 */
function MobileApplicationCard({
  application,
  onStatusChange,
}: {
  application: ApplicationWithRelations
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>
}) {
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const availableStatuses: ApplicationStatus[] = [
    'NOT_STARTED',
    'TODO',
    'IN_PROGRESS',
    'READY_FOR_REVIEW',
    'SUBMITTED',
    'AWAITING_DECISION',
    'AWARDED',
    'DENIED',
    'WITHDRAWN',
  ]

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === application.status) return

    setIsChangingStatus(true)
    try {
      await onStatusChange(application.id, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <div className="relative">
      <ApplicationCard application={application} />

      {/* Status Change Dropdown */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isChangingStatus}
              className="h-8 px-2 text-xs"
            >
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={status === application.status}
                className={cn(
                  status === application.status && 'bg-blue-50 font-medium'
                )}
              >
                {getStatusText(status)}
                {status === application.status && ' (Current)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function MobileList({ applications, onStatusChange }: MobileListProps) {
  // Group applications by column status
  const groupedApplications = groupByStatus(applications)

  return (
    <div className="space-y-4">
      {/* TODO Section (open by default) */}
      <CollapsibleSection
        status="TODO"
        applications={groupedApplications.TODO}
        defaultOpen={true}
      >
        {groupedApplications.TODO.map((app) => (
          <MobileApplicationCard key={app.id} application={app} onStatusChange={onStatusChange} />
        ))}
      </CollapsibleSection>

      {/* IN_PROGRESS Section (open by default) */}
      <CollapsibleSection
        status="IN_PROGRESS"
        applications={groupedApplications.IN_PROGRESS}
        defaultOpen={true}
      >
        {groupedApplications.IN_PROGRESS.map((app) => (
          <MobileApplicationCard key={app.id} application={app} onStatusChange={onStatusChange} />
        ))}
      </CollapsibleSection>

      {/* BACKLOG Section */}
      <CollapsibleSection
        status="BACKLOG"
        applications={groupedApplications.BACKLOG}
        defaultOpen={false}
      >
        {groupedApplications.BACKLOG.map((app) => (
          <MobileApplicationCard key={app.id} application={app} onStatusChange={onStatusChange} />
        ))}
      </CollapsibleSection>

      {/* SUBMITTED Section */}
      <CollapsibleSection
        status="SUBMITTED"
        applications={groupedApplications.SUBMITTED}
        defaultOpen={false}
      >
        {groupedApplications.SUBMITTED.map((app) => (
          <MobileApplicationCard key={app.id} application={app} onStatusChange={onStatusChange} />
        ))}
      </CollapsibleSection>
    </div>
  )
}
