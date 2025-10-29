/**
 * StatusDropdown Component
 *
 * Application status management with transition validation and completion gates.
 * Prevents invalid status transitions and enforces 100% completion before READY_FOR_REVIEW.
 *
 * Story 3.8 AC#4: Status dropdown with lifecycle management
 *
 * @module components/workspace/StatusDropdown
 */

'use client'

import React, { useState } from 'react'
import { Lock, AlertTriangle } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

interface StatusDropdownProps {
  /**
   * Current application status
   */
  currentStatus: ApplicationStatus

  /**
   * Application ID for compliance validation (Story 4.3)
   */
  applicationId: string

  /**
   * Progress data for validation
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
   * Whether status is currently being updated
   */
  isUpdating?: boolean

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Valid status transitions map
 */
const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  NOT_STARTED: ['TODO'],
  TODO: ['IN_PROGRESS', 'WITHDRAWN'],
  IN_PROGRESS: ['READY_FOR_REVIEW', 'TODO', 'WITHDRAWN'],
  READY_FOR_REVIEW: ['SUBMITTED', 'IN_PROGRESS'],
  SUBMITTED: ['AWAITING_DECISION'],
  AWAITING_DECISION: ['AWARDED', 'DENIED'],
  AWARDED: [],
  DENIED: [],
  WITHDRAWN: [],
}

/**
 * Status display configuration
 */
const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; description: string }
> = {
  NOT_STARTED: {
    label: 'Not Started',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'Application has not been started',
  },
  TODO: {
    label: 'To Do',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Ready to begin working on application',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    description: 'Actively working on application',
  },
  READY_FOR_REVIEW: {
    label: 'Ready for Review',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    description: 'All requirements complete, ready for final review',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    description: 'Application submitted to organization',
  },
  AWAITING_DECISION: {
    label: 'Awaiting Decision',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    description: 'Waiting for organization decision',
  },
  AWARDED: {
    label: 'Awarded',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    description: 'Scholarship awarded!',
  },
  DENIED: {
    label: 'Not Awarded',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description: 'Application not selected',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'Application withdrawn',
  },
}

/**
 * Check if status can be transitioned to (synchronous validation only)
 * Compliance check is done separately via async validateCompliance
 */
function canTransitionTo(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
  progress: StatusDropdownProps['progress']
): { allowed: boolean; blockers: string[] } {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []

  // Check if transition is allowed
  if (!allowedTransitions.includes(targetStatus)) {
    return { allowed: false, blockers: ['Invalid status transition'] }
  }

  // Special validation for READY_FOR_REVIEW
  if (targetStatus === 'READY_FOR_REVIEW') {
    const blockers: string[] = []

    if (progress.essayComplete < progress.essayCount) {
      blockers.push(`${progress.essayCount - progress.essayComplete} essay(s) incomplete`)
    }
    if (progress.documentsUploaded < progress.documentsRequired) {
      blockers.push(
        `${progress.documentsRequired - progress.documentsUploaded} document(s) missing`
      )
    }
    if (progress.recsReceived < progress.recsRequired) {
      blockers.push(`${progress.recsRequired - progress.recsReceived} recommendation(s) pending`)
    }

    // Note: Document compliance validation is done async in handleStatusSelect
    // We can't check it here as it requires an async API call

    if (blockers.length > 0) {
      return { allowed: false, blockers }
    }
  }

  return { allowed: true, blockers: [] }
}

/**
 * Get confirmation message for significant transitions
 */
function getConfirmationMessage(targetStatus: ApplicationStatus): string | null {
  switch (targetStatus) {
    case 'SUBMITTED':
      return 'Are you sure you want to mark this as submitted? Make sure you have submitted the application to the organization.'
    case 'WITHDRAWN':
      return 'Are you sure you want to withdraw this application? You can add it back later if needed.'
    default:
      return null
  }
}

export function StatusDropdown({
  currentStatus,
  applicationId,
  progress,
  onStatusChange,
  isUpdating = false,
  className,
}: StatusDropdownProps) {
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [complianceIssues, setComplianceIssues] = useState<string[]>([])
  const router = useRouter()

  const utils = trpc.useUtils()
  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || []
  const currentConfig = STATUS_CONFIG[currentStatus]

  const handleStatusSelect = async (newStatus: string) => {
    const targetStatus = newStatus as ApplicationStatus

    // Check if transition is valid
    const validation = canTransitionTo(currentStatus, targetStatus, progress)

    if (!validation.allowed) {
      // Show error (could be toast notification in real implementation)
      alert(`Cannot transition to ${STATUS_CONFIG[targetStatus].label}.\n\n${validation.blockers.join('\n')}`)
      return
    }

    // Story 4.3: Check document compliance for READY_FOR_REVIEW
    if (targetStatus === 'READY_FOR_REVIEW') {
      try {
        const complianceReport = await utils.application.validateCompliance.fetch({
          applicationId,
        })

        if (!complianceReport.compliant) {
          // Non-compliant documents found
          const issues = complianceReport.issues.map(
            (issue) => `${issue.documentType}: ${issue.errors.join(', ')}`
          )
          setComplianceIssues(issues)
          setPendingStatus(targetStatus)
          setShowConfirmation(true)
          return
        }
      } catch (error) {
        alert('Failed to validate document compliance. Please try again.')
        return
      }
    }

    // Check if confirmation is needed
    const confirmationMessage = getConfirmationMessage(targetStatus)
    if (confirmationMessage) {
      setPendingStatus(targetStatus)
      setShowConfirmation(true)
      return
    }

    // No confirmation needed - update directly
    await onStatusChange(targetStatus)
  }

  const handleConfirm = async () => {
    if (pendingStatus) {
      await onStatusChange(pendingStatus)
      setPendingStatus(null)
      setComplianceIssues([])
    }
    setShowConfirmation(false)
  }

  const handleCancel = () => {
    setPendingStatus(null)
    setComplianceIssues([])
    setShowConfirmation(false)
  }

  const handleViewComplianceReport = () => {
    router.push(`/dashboard/applications/${applicationId}/compliance`)
    setShowConfirmation(false)
  }

  return (
    <>
      <div className={className}>
        <Select value={currentStatus} onValueChange={handleStatusSelect} disabled={isUpdating}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <Badge className={currentConfig.color}>{currentConfig.label}</Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Current status */}
            <SelectItem value={currentStatus} disabled>
              <div className="flex items-center gap-2">
                <Badge className={currentConfig.color}>{currentConfig.label}</Badge>
                <span className="text-xs text-gray-500">(current)</span>
              </div>
            </SelectItem>

            {/* Available transitions */}
            {availableTransitions.map((status) => {
              const config = STATUS_CONFIG[status]
              const validation = canTransitionTo(currentStatus, status, progress)

              return (
                <SelectItem key={status} value={status} disabled={!validation.allowed}>
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>{config.label}</Badge>
                    {!validation.allowed && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Lock className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Blocked:</p>
                            <ul className="mt-1 text-xs list-disc list-inside">
                              {validation.blockers.map((blocker, i) => (
                                <li key={i}>{blocker}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{currentConfig.description}</p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {complianceIssues.length > 0 ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Document Compliance Issues</span>
                </div>
              ) : (
                'Confirm Status Change'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {complianceIssues.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-red-600 font-medium">
                    Your documents have {complianceIssues.length} compliance issue(s):
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {complianceIssues.map((issue, idx) => (
                      <li key={idx} className="text-red-600">{issue}</li>
                    ))}
                  </ul>
                  <p className="text-sm mt-3">
                    These documents do not meet the scholarship requirements. You can:
                  </p>
                  <ul className="text-sm space-y-1 list-decimal list-inside ml-2">
                    <li>View the full compliance report to see detailed issues and fixes</li>
                    <li>Fix the issues and re-upload compliant documents</li>
                    <li>Override and mark as ready anyway (not recommended)</li>
                  </ul>
                </div>
              ) : (
                pendingStatus && getConfirmationMessage(pendingStatus)
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {complianceIssues.length > 0 ? (
              <>
                <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                <Button variant="outline" onClick={handleViewComplianceReport}>
                  View Compliance Report
                </Button>
                <AlertDialogAction onClick={handleConfirm} className="bg-yellow-600 hover:bg-yellow-700">
                  Override & Continue
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
