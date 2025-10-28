/**
 * Story 3.9: Bulk Application Management
 *
 * BulkActionsToolbar Component
 * Displays when applications are selected, showing selection count and bulk action buttons
 */

'use client'

import { Button } from '@/components/ui/button'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { X, Archive, Trash2, Flag, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ApplicationStatus, PriorityTier } from '@prisma/client'
import { useState } from 'react'
import { ConfirmationDialog } from './ConfirmationDialog'
import { api } from '@/trpc/react'
import { toast } from 'sonner'

interface BulkActionsToolbarProps {
  onActionComplete?: () => void
}

export function BulkActionsToolbar({ onActionComplete }: BulkActionsToolbarProps) {
  const { getSelectedCount, getSelectedIds, clearSelection } = useSelectionStore()
  const selectedCount = getSelectedCount()
  const selectedIds = getSelectedIds()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  // tRPC mutations
  const bulkUpdateMutation = api.application.bulkUpdate.useMutation({
    onSuccess: (data) => {
      if (data.failed === 0) {
        toast.success(`${data.success} application${data.success > 1 ? 's' : ''} updated successfully`)
      } else {
        toast.warning(
          `${data.success} of ${selectedCount} application${selectedCount > 1 ? 's' : ''} updated. ${data.failed} failed.`,
          {
            description: data.errors?.map(e => e.reason).join(', ')
          }
        )
      }
      clearSelection()
      onActionComplete?.()
    },
    onError: (error) => {
      toast.error('Failed to update applications', {
        description: error.message
      })
    }
  })

  const handleStatusChange = (status: ApplicationStatus) => {
    bulkUpdateMutation.mutate({
      applicationIds: selectedIds,
      action: 'CHANGE_STATUS',
      params: { status }
    })
  }

  const handlePriorityChange = (priorityTier: PriorityTier) => {
    bulkUpdateMutation.mutate({
      applicationIds: selectedIds,
      action: 'SET_PRIORITY',
      params: { priorityTier }
    })
  }

  const handleArchive = () => {
    bulkUpdateMutation.mutate({
      applicationIds: selectedIds,
      action: 'ARCHIVE'
    })
    setShowArchiveDialog(false)
  }

  const handleDelete = () => {
    bulkUpdateMutation.mutate({
      applicationIds: selectedIds,
      action: 'DELETE'
    })
    setShowDeleteDialog(false)
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white rounded-lg shadow-lg px-6 py-3 flex items-center gap-4 animate-slide-down">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">
            {selectedCount} selected
          </span>
        </div>

        <div className="h-6 w-px bg-blue-400" />

        {/* Change Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange('TODO')}>
              TODO
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('READY_FOR_REVIEW')}>
              Ready for Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('SUBMITTED')}>
              Submitted
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Set Priority Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Flag className="h-4 w-4 mr-2" />
              Set Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Priority Tier</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePriorityChange('MUST_APPLY')}>
              Must Apply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange('SHOULD_APPLY')}>
              Should Apply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange('IF_TIME_PERMITS')}>
              If Time Permits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange('HIGH_VALUE_REACH')}>
              High Value Reach
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Archive Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowArchiveDialog(true)}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>

        {/* Delete Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          className="text-white hover:bg-blue-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={handleArchive}
        title="Archive Applications?"
        description={`Archive ${selectedCount} application${selectedCount > 1 ? 's' : ''}? They'll be hidden from active view but can be restored later.`}
        confirmText={`Archive ${selectedCount} Application${selectedCount > 1 ? 's' : ''}`}
        variant="default"
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Applications?"
        description={`Delete ${selectedCount} application${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${selectedCount} Application${selectedCount > 1 ? 's' : ''}`}
        variant="destructive"
      />
    </>
  )
}
