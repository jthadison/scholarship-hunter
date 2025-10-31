/**
 * CelebrationModal Component
 *
 * Modal with confetti animation for celebrating scholarship awards.
 * Features:
 * - Confetti animation on mount
 * - Congratulatory message with scholarship name and award amount
 * - Call-to-action buttons (View Analytics, Apply to Next Scholarship)
 * - Fires only once per award (tracked via session storage)
 *
 * Story: 5.1 - Outcome Tracking & Status Updates (AC #7)
 * @module components/outcomes/CelebrationModal
 */

'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Search } from 'lucide-react'

interface CelebrationModalProps {
  open: boolean
  onClose: () => void
  scholarshipName: string
  awardAmount: number
  outcomeId: string
}

export function CelebrationModal({
  open,
  onClose,
  scholarshipName,
  awardAmount,
  outcomeId,
}: CelebrationModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (open) {
      // Check if celebration already shown for this outcome
      const celebrationKey = `celebration-shown-${outcomeId}`
      const alreadyShown = sessionStorage.getItem(celebrationKey)

      if (!alreadyShown) {
        // Trigger confetti animation
        triggerConfetti()

        // Mark celebration as shown in session storage
        sessionStorage.setItem(celebrationKey, 'true')
      }
    }
  }, [open, outcomeId])

  const triggerConfetti = () => {
    const duration = 3000 // 3 seconds
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Confetti from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })

      // Confetti from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)
  }

  const handleViewAnalytics = () => {
    onClose()
    router.push('/dashboard') // Assuming analytics are on dashboard
  }

  const handleApplyNext = () => {
    onClose()
    router.push('/scholarships') // Assuming scholarship discovery is here
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Trophy className="h-10 w-10 text-yellow-600" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            You've been awarded
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4">
          {/* Scholarship Name */}
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center">
            <p className="text-lg font-semibold text-green-900">{scholarshipName}</p>
          </div>

          {/* Award Amount */}
          <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-6 text-center">
            <p className="text-sm font-medium text-yellow-800 mb-1">Award Amount</p>
            <p className="text-4xl font-bold text-yellow-700">
              ${awardAmount.toLocaleString()}
            </p>
          </div>

          {/* Success Message */}
          <p className="text-center text-sm text-muted-foreground">
            Your hard work has paid off! This is a great achievement that brings you closer to your educational goals.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleViewAnalytics}
            className="w-full"
            size="lg"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button
            onClick={handleApplyNext}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Search className="mr-2 h-4 w-4" />
            Apply to Next Scholarship
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
