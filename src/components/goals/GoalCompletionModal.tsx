/**
 * Goal Completion Modal
 *
 * Celebration modal shown when a goal is achieved.
 * Features confetti animation and profile strength impact display.
 *
 * Story 5.4: Profile Improvement Tracker
 * AC5: Milestone celebrations
 * AC6: Impact updates
 *
 * @module components/goals/GoalCompletionModal
 */

'use client'

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface GoalCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  goalTitle: string
  profileStrengthBefore: number
  profileStrengthAfter: number
}

export function GoalCompletionModal({
  isOpen,
  onClose,
  goalTitle,
  profileStrengthBefore,
  profileStrengthAfter,
}: GoalCompletionModalProps) {
  const profileGain = profileStrengthAfter - profileStrengthBefore

  // Trigger confetti when modal opens
  useEffect(() => {
    if (!isOpen) return

    // Fire confetti from multiple angles
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number): number {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      // Fire from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })

      // Fire from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl justify-center">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <span>Goal Achieved!</span>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Congratulations! You've reached your goal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Goal Title */}
          <div className="text-center">
            <p className="text-xl font-semibold text-primary">{goalTitle}</p>
          </div>

          {/* Profile Strength Impact */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center gap-2 mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Profile Strength Impact
              </h3>
            </div>

            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round(profileStrengthBefore)}
              </span>
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span className="text-green-600 dark:text-green-400">
                {Math.round(profileStrengthAfter)}
              </span>
            </div>

            <div className="mt-3 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your profile strength increased by{' '}
                <strong className="text-green-600 dark:text-green-400">
                  +{Math.round(profileGain)} points
                </strong>
              </p>
            </div>
          </div>

          {/* Encouragement Message */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Keep up the great work! You're one step closer to qualifying for more scholarships.</p>
          </div>
        </div>

        <DialogFooter className="justify-center">
          <Button onClick={onClose} size="lg" className="px-8">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
