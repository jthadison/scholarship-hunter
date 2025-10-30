/**
 * OutcomeHistoryLog Component
 *
 * Displays chronological list of all scholarship decisions with:
 * - Date
 * - Scholarship name
 * - Outcome result
 * - Award amount (if awarded)
 * - Collapsible/expandable view
 *
 * Story: 5.1 - Outcome Tracking & Status Updates (AC #6)
 * @module components/outcomes/OutcomeHistoryLog
 */

'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, History, Trophy, XCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { OutcomeResult } from '@prisma/client'

const OUTCOME_CONFIG = {
  [OutcomeResult.AWARDED]: {
    label: 'Awarded',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: Trophy,
  },
  [OutcomeResult.DENIED]: {
    label: 'Denied',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle,
  },
  [OutcomeResult.WAITLISTED]: {
    label: 'Waitlisted',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock,
  },
  [OutcomeResult.WITHDRAWN]: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: AlertCircle,
  },
}

export function OutcomeHistoryLog() {
  const [isOpen, setIsOpen] = useState(true)
  const { data: outcomes, isLoading, isError } = trpc.outcome.getHistory.useQuery()

  if (isLoading) {
    return <OutcomeHistoryLogSkeleton />
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Outcome History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load outcome history. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!outcomes || outcomes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Outcome History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No outcomes recorded yet. Start applying and record your results here!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Outcome History
              <Badge variant="secondary" className="ml-2">
                {outcomes.length}
              </Badge>
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {outcomes.map((outcome) => {
                const config = OUTCOME_CONFIG[outcome.result]
                const Icon = config.icon
                const decisionDate = outcome.decisionDate
                  ? new Date(outcome.decisionDate)
                  : null

                return (
                  <div
                    key={outcome.id}
                    className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                  >
                    {/* Icon */}
                    <div className={`rounded-full p-2 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      {/* Date */}
                      <p className="text-xs text-muted-foreground">
                        {decisionDate
                          ? format(decisionDate, 'MMM d, yyyy')
                          : 'Date not specified'}
                      </p>

                      {/* Scholarship Name */}
                      <p className="font-medium">
                        {outcome.application.scholarship.name}
                      </p>

                      {/* Outcome Badge and Amount */}
                      <div className="flex items-center gap-2">
                        <Badge className={config.color} variant="outline">
                          {config.label}
                        </Badge>
                        {outcome.result === OutcomeResult.AWARDED &&
                          outcome.awardAmountReceived && (
                            <span className="text-sm font-semibold text-green-700">
                              ${outcome.awardAmountReceived.toLocaleString()}
                            </span>
                          )}
                      </div>

                      {/* Notes (if any) */}
                      {outcome.notes && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          "{outcome.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function OutcomeHistoryLogSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Outcome History
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-md border p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
