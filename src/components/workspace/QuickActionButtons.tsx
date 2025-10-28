/**
 * QuickActionButtons Component
 *
 * Floating action buttons for common workflows:
 * - Start/edit essay
 * - Upload document
 * - Request recommendation
 *
 * Story 3.8 AC#2: Quick action buttons
 *
 * @module components/workspace/QuickActionButtons
 */

'use client'

import React from 'react'
import { FileText, Upload, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspaceModalStore } from '@/stores/workspaceModalStore'
import { cn } from '@/lib/utils'

interface QuickActionButtonsProps {
  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Show as FAB (floating action button) or inline
   */
  variant?: 'fab' | 'inline'
}

export function QuickActionButtons({ className, variant = 'inline' }: QuickActionButtonsProps) {
  const { openModal } = useWorkspaceModalStore()

  if (variant === 'fab') {
    return (
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex flex-col gap-2',
          'md:hidden', // Only show FAB on mobile
          className
        )}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => openModal('essay')}
          aria-label="Start essay"
        >
          <FileText className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => openModal('document')}
          aria-label="Upload document"
        >
          <Upload className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => openModal('recommendation')}
          aria-label="Request recommendation"
        >
          <UserCheck className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button onClick={() => openModal('essay')} className="flex-1 sm:flex-none">
        <FileText className="mr-2 h-4 w-4" />
        Start Essay
      </Button>
      <Button onClick={() => openModal('document')} className="flex-1 sm:flex-none">
        <Upload className="mr-2 h-4 w-4" />
        Upload Document
      </Button>
      <Button onClick={() => openModal('recommendation')} className="flex-1 sm:flex-none">
        <UserCheck className="mr-2 h-4 w-4" />
        Request Recommendation
      </Button>
    </div>
  )
}
