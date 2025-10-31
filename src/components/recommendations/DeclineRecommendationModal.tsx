/**
 * Decline Recommendation Modal Component
 * Story 5.7 - Task 6: Decline modal for scholarship recommendations
 *
 * Modal for students to decline a scholarship recommendation with optional reason.
 *
 * @module components/recommendations/DeclineRecommendationModal
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export interface DeclineRecommendationModalProps {
  open: boolean
  onClose: () => void
  onDecline: (reason?: string) => void
  scholarshipName: string
  counselorName: string
}

/**
 * Modal for declining a scholarship recommendation
 *
 * Task 6.4: On decline: Show DeclineModal with optional textarea for reason (visible to counselor)
 */
export function DeclineRecommendationModal({
  open,
  onClose,
  onDecline,
  scholarshipName,
  counselorName,
}: DeclineRecommendationModalProps) {
  const [reason, setReason] = useState('')

  const handleDecline = () => {
    onDecline(reason || undefined)
    setReason('')
    onClose()
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Decline Recommendation</DialogTitle>
          <DialogDescription>
            You're about to decline the recommendation for "{scholarshipName}" from{' '}
            {counselorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="decline-reason">
            Reason for declining <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Textarea
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Already applied to this scholarship, Not interested in this field, Deadline too soon..."
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground">
            {reason.length}/500 characters
          </div>
          <p className="text-xs text-muted-foreground">
            Your counselor will see this reason to better understand your preferences.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDecline}>
            Decline Recommendation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
