/**
 * WorkspaceHeader Component
 *
 * Workspace header with breadcrumb navigation, status dropdown, and deadline countdown.
 * Sticky on mobile for persistent access to key information.
 *
 * Story 3.8 AC#1: Workspace header with context
 *
 * @module components/workspace/WorkspaceHeader
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { StatusDropdown } from './StatusDropdown'
import { DeadlineCountdown } from './DeadlineCountdown'
import { cn } from '@/lib/utils'

type ApplicationStatus =
  | 'NOT_STARTED'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'SUBMITTED'
  | 'AWAITING_DECISION'
  | 'AWARDED'
  | 'DENIED'
  | 'WITHDRAWN'

interface WorkspaceHeaderProps {
  /**
   * Application ID (Story 4.3)
   */
  applicationId: string

  /**
   * Scholarship name for breadcrumb
   */
  scholarshipName: string

  /**
   * Application status
   */
  status: ApplicationStatus

  /**
   * Deadline date
   */
  deadline: Date

  /**
   * Progress data for status validation
   */
  progress: {
    essayCount: number
    essayComplete: number
    documentsRequired: number
    documentsUploaded: number
    recsRequired: number
    recsReceived: number
    progressPercentage: number
  }

  /**
   * Callback when status changes
   */
  onStatusChange: (newStatus: ApplicationStatus) => Promise<void>

  /**
   * Whether status is updating
   */
  isUpdating?: boolean

  /**
   * Additional CSS classes
   */
  className?: string
}

export function WorkspaceHeader({
  applicationId,
  scholarshipName,
  status,
  deadline,
  progress,
  onStatusChange,
  isUpdating = false,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="px-4 py-4 space-y-4 md:px-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href="/applications"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Applications
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] md:max-w-none">
            {scholarshipName}
          </span>
        </nav>

        {/* Status and Deadline Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Application Status
            </label>
            <StatusDropdown
              currentStatus={status}
              applicationId={applicationId}
              progress={progress}
              onStatusChange={onStatusChange}
              isUpdating={isUpdating}
            />
          </div>

          {/* Deadline Countdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deadline
            </label>
            <DeadlineCountdown
              deadline={deadline}
              progressPercentage={progress.progressPercentage}
              showMessage={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
