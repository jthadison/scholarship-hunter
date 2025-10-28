/**
 * useDeadlineCountdown Hook
 *
 * Real-time countdown timer that updates every minute.
 * Calculates time remaining and urgency level for deadline display.
 *
 * Story 3.8 AC#5: Real-time countdown with urgency color coding
 *
 * @module hooks/useDeadlineCountdown
 */

'use client'

import { useEffect, useState } from 'react'

export type UrgencyLevel = 'safe' | 'warning' | 'urgent' | 'critical'

export interface CountdownData {
  days: number
  hours: number
  minutes: number
  isPast: boolean
  urgencyLevel: UrgencyLevel
  displayText: string
  motivationalMessage: string
}

/**
 * Calculate time remaining until deadline
 */
function getTimeRemaining(deadline: Date): Omit<CountdownData, 'urgencyLevel' | 'displayText' | 'motivationalMessage'> {
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()

  if (diffMs < 0) {
    const daysPast = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    return {
      days: daysPast,
      hours: 0,
      minutes: 0,
      isPast: true,
    }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, isPast: false }
}

/**
 * Get urgency level based on days remaining
 * Safe: >7 days (green)
 * Warning: 3-7 days (yellow)
 * Urgent: 1-3 days (orange)
 * Critical: <24 hours (red)
 */
function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining > 7) return 'safe'
  if (daysRemaining >= 3) return 'warning'
  if (daysRemaining >= 1) return 'urgent'
  return 'critical'
}

/**
 * Format countdown for display
 */
function formatCountdown(time: ReturnType<typeof getTimeRemaining>): string {
  if (time.isPast) {
    return `Deadline passed ${time.days} ${time.days === 1 ? 'day' : 'days'} ago`
  }

  if (time.days === 0) {
    // Less than 24 hours - show hours and minutes
    if (time.hours === 0) {
      return `${time.minutes} ${time.minutes === 1 ? 'minute' : 'minutes'} remaining`
    }
    return `${time.hours} ${time.hours === 1 ? 'hour' : 'hours'}, ${time.minutes} ${time.minutes === 1 ? 'minute' : 'minutes'} remaining`
  }

  // More than 24 hours - show days and hours
  return `${time.days} ${time.days === 1 ? 'day' : 'days'}, ${time.hours} ${time.hours === 1 ? 'hour' : 'hours'} remaining`
}

/**
 * Get motivational message based on urgency and progress
 */
function getMotivationalMessage(
  urgencyLevel: UrgencyLevel,
  progressPercentage: number
): string {
  // Deadline passed
  if (urgencyLevel === 'critical' && progressPercentage < 100) {
    return 'Contact the organization about deadline extension'
  }

  // Critical: <24 hours
  if (urgencyLevel === 'critical') {
    if (progressPercentage >= 80) {
      return 'Almost there! Final push to submit on time!'
    }
    return 'Deadline is TODAY! Focus on essentials only.'
  }

  // Urgent: 1-3 days
  if (urgencyLevel === 'urgent') {
    if (progressPercentage >= 60) {
      return 'You\'re making great progress! Keep going!'
    }
    return 'Time to focus - deadline approaching fast.'
  }

  // Warning: 3-7 days
  if (urgencyLevel === 'warning') {
    if (progressPercentage >= 50) {
      return 'You\'re on track! Stay consistent this week.'
    }
    return 'This is a critical week - time to accelerate.'
  }

  // Safe: >7 days
  if (progressPercentage >= 30) {
    return 'You\'re ahead of schedule! Great work!'
  }
  return 'Plenty of time - set up a steady pace.'
}

/**
 * Hook that provides real-time countdown to deadline
 *
 * Updates every minute to reduce CPU usage while maintaining accuracy.
 *
 * @param deadline - Target deadline date
 * @param progressPercentage - Current progress (0-100) for motivational messages
 * @returns Countdown data with urgency level and display text
 */
export function useDeadlineCountdown(
  deadline: Date | null | undefined,
  progressPercentage: number = 0
): CountdownData | null {
  const [countdown, setCountdown] = useState<CountdownData | null>(null)

  useEffect(() => {
    if (!deadline) {
      setCountdown(null)
      return
    }

    // Calculate initial countdown
    const calculateCountdown = () => {
      const time = getTimeRemaining(deadline)
      const urgencyLevel = time.isPast ? 'critical' : getUrgencyLevel(time.days)
      const displayText = formatCountdown(time)
      const motivationalMessage = getMotivationalMessage(urgencyLevel, progressPercentage)

      setCountdown({
        ...time,
        urgencyLevel,
        displayText,
        motivationalMessage,
      })
    }

    // Set initial value
    calculateCountdown()

    // Update every minute
    const interval = setInterval(calculateCountdown, 60000)

    return () => clearInterval(interval)
  }, [deadline, progressPercentage])

  return countdown
}
