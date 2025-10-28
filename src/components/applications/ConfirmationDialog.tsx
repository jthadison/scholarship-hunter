/**
 * Story 3.9: Bulk Application Management
 *
 * ConfirmationDialog Component
 * Reusable confirmation dialog for destructive bulk actions
 */

'use client'

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
import { cn } from '@/lib/utils'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              variant === 'destructive' && 'bg-red-600 hover:bg-red-700'
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
