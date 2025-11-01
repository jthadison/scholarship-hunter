'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Trophy, Sparkles, TrendingUp } from 'lucide-react'
import confetti from 'canvas-confetti'
import { formatCurrency } from '@/lib/utils'

interface EncouragementBannerProps {
  studentName: string
  fundingSecured: number
  awardsCount: number
}

/**
 * Encouragement Banner Component
 *
 * Displays celebratory messages and achievements to encourage parents.
 * Story 5.8: Parent/Guardian View - Task 8 (Encouragement and Celebration Features)
 */
export function EncouragementBanner({
  studentName,
  fundingSecured,
  awardsCount,
}: EncouragementBannerProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false)

  // Trigger confetti on first load if student has awards
  useEffect(() => {
    if (awardsCount > 0 && !hasTriggeredConfetti) {
      // Check if this is first view (use localStorage to track)
      const confettiKey = `confetti-shown-${studentName}-${fundingSecured}`
      const hasShownConfetti = localStorage.getItem(confettiKey)

      if (!hasShownConfetti) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
          localStorage.setItem(confettiKey, 'true')
        }, 500)
      }

      setHasTriggeredConfetti(true)
    }
  }, [awardsCount, fundingSecured, studentName, hasTriggeredConfetti])

  // Generate encouragement message based on funding
  const getMessage = () => {
    if (fundingSecured === 0) {
      return {
        icon: <Sparkles className="h-6 w-6" />,
        title: `${studentName} is working hard!`,
        description: `They're actively pursuing scholarship opportunities. Every application is a step toward success!`,
        color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
      }
    }

    if (fundingSecured < 5000) {
      return {
        icon: <TrendingUp className="h-6 w-6" />,
        title: `Great start!`,
        description: `${studentName} has secured ${formatCurrency(fundingSecured)} in scholarships. Keep up the momentum!`,
        color: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      }
    }

    if (fundingSecured < 15000) {
      return {
        icon: <Trophy className="h-6 w-6" />,
        title: `Excellent progress!`,
        description: `${studentName} has secured ${formatCurrency(fundingSecured)} from ${awardsCount} scholarship${
          awardsCount !== 1 ? 's' : ''
        }. This is a significant achievement!`,
        color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
      }
    }

    return {
      icon: <Trophy className="h-6 w-6" />,
      title: `Outstanding achievement!`,
      description: `${studentName} has secured ${formatCurrency(fundingSecured)} in scholarships! This is an incredible accomplishment that will make a real difference in their college journey.`,
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    }
  }

  const message = getMessage()

  return (
    <Card className={`border-2 ${message.color}`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">{message.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{message.title}</h3>
            <p className="text-sm text-muted-foreground">{message.description}</p>

            {/* Achievement Milestones */}
            {fundingSecured > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {fundingSecured >= 1000 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-xs font-medium">
                    <Trophy className="h-3 w-3" />
                    First $1,000
                  </span>
                )}
                {fundingSecured >= 5000 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium">
                    <Trophy className="h-3 w-3" />
                    $5,000 Milestone
                  </span>
                )}
                {fundingSecured >= 10000 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900 px-3 py-1 text-xs font-medium">
                    <Trophy className="h-3 w-3" />
                    $10,000 Milestone
                  </span>
                )}
                {awardsCount >= 3 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900 px-3 py-1 text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Multiple Awards
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
