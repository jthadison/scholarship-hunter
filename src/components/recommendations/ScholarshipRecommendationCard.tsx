/**
 * Scholarship Recommendation Card Component
 * Story 5.7 - Task 6: Build Student Recommendation Response UI
 *
 * Displays a scholarship recommendation from a counselor with accept/decline actions.
 *
 * Features:
 * - Scholarship details (name, award, deadline, match score)
 * - Counselor information and note
 * - Accept action (adds to applications)
 * - Decline action (opens modal for optional reason)
 * - Optimistic UI updates
 *
 * @module components/recommendations/ScholarshipRecommendationCard
 */

'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Calendar, DollarSign, Award } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { trpc } from '@/shared/lib/trpc'
import { toast } from 'sonner'
import { DeclineRecommendationModal } from './DeclineRecommendationModal'

export interface ScholarshipRecommendationCardProps {
  recommendation: {
    id: string
    note?: string | null
    createdAt: Date
    scholarship: {
      id: string
      name: string
      provider: string
      awardAmount: number
      deadline: Date
      description?: string
    }
    counselor: {
      id: string
      firstName: string
      lastName: string
      schoolName?: string
    }
  }
  matchScore?: number
  /** Callback after recommendation is responded to */
  onRespond?: () => void
}

/**
 * Recommendation card with accept/decline actions
 *
 * AC #5: Student response: Accept recommendation (add to applications) or decline (with optional reason)
 * Task 6.1: Display scholarship name, award amount, deadline, match score, counselor name/note
 * Task 6.2: Add "Add to My Applications" (accept) and "Decline" buttons
 * Task 6.3: On accept: Create Application record, show success message
 * Task 6.4: On decline: Show DeclineModal with optional textarea for reason
 * Task 6.5: Update recommendation status in real-time (optimistic UI)
 */
export function ScholarshipRecommendationCard({
  recommendation,
  matchScore,
  onRespond,
}: ScholarshipRecommendationCardProps) {
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [isResponded, setIsResponded] = useState(false)

  const utils = trpc.useUtils()

  const respondMutation = trpc.scholarshipRecommendation.respond.useMutation({
    onSuccess: (data: { applicationCreated?: boolean }, variables: { status: string }) => {
      setIsResponded(true)
      utils.scholarshipRecommendation.getByStudent.invalidate()

      if (variables.status === 'ACCEPTED') {
        toast.success(
          data.applicationCreated
            ? 'Scholarship added to your applications!'
            : 'Recommendation accepted (scholarship already in your applications)'
        )
      } else {
        toast.success('Recommendation declined')
      }

      onRespond?.()
    },
    onError: (error: { message: string }) => {
      toast.error(error.message)
    },
  })

  const handleAccept = () => {
    respondMutation.mutate({
      recommendationId: recommendation.id,
      status: 'ACCEPTED',
    })
  }

  const handleDecline = (reason?: string) => {
    respondMutation.mutate({
      recommendationId: recommendation.id,
      status: 'DECLINED',
      responseNote: reason,
    })
    setShowDeclineModal(false)
  }

  const counselorInitials = `${recommendation.counselor.firstName[0]}${recommendation.counselor.lastName[0]}`
  const daysUntilDeadline = Math.ceil(
    (new Date(recommendation.scholarship.deadline).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <>
      <Card className={isResponded ? 'opacity-60' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{recommendation.scholarship.name}</CardTitle>
              <CardDescription>{recommendation.scholarship.provider}</CardDescription>
            </div>
            {matchScore && (
              <Badge variant={matchScore >= 80 ? 'default' : 'secondary'} className="ml-2">
                <Award className="mr-1 h-3 w-3" />
                {Math.round(matchScore)}% Match
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Scholarship details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  ${recommendation.scholarship.awardAmount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Award Amount</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div
                  className={`font-medium ${daysUntilDeadline <= 30 ? 'text-orange-600' : ''}`}
                >
                  {new Date(recommendation.scholarship.deadline).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysUntilDeadline} days left
                </div>
              </div>
            </div>
          </div>

          {/* Counselor recommendation note */}
          {recommendation.note && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{counselorInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {recommendation.counselor.firstName} {recommendation.counselor.lastName}
                  </p>
                  {recommendation.counselor.schoolName && (
                    <p className="text-xs text-muted-foreground">
                      {recommendation.counselor.schoolName}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm italic text-muted-foreground">"{recommendation.note}"</p>
            </div>
          )}

          {/* Description preview */}
          {recommendation.scholarship.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {recommendation.scholarship.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {!isResponded && (
            <>
              <Button
                onClick={handleAccept}
                disabled={respondMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Add to My Applications
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeclineModal(true)}
                disabled={respondMutation.isPending}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </>
          )}
          {isResponded && (
            <div className="w-full text-center text-sm text-muted-foreground">
              Response recorded
            </div>
          )}
        </CardFooter>
      </Card>

      <DeclineRecommendationModal
        open={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onDecline={handleDecline}
        scholarshipName={recommendation.scholarship.name}
        counselorName={`${recommendation.counselor.firstName} ${recommendation.counselor.lastName}`}
      />
    </>
  )
}
