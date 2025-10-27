/**
 * Alex Analysis Dialog Component (Story 2.12)
 *
 * Dialog/modal wrapper for displaying Alex's eligibility analysis.
 * Fetches analysis on-demand when opened and displays in a scrollable modal.
 *
 * @module components/alex/AlexAnalysisDialog
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { User2, Loader2 } from 'lucide-react'
import { AlexAnalysisReport } from './AlexAnalysisReport'
import { trpc } from '@/shared/lib/trpc'

interface AlexAnalysisDialogProps {
  studentId: string
  scholarshipId: string
  scholarshipName: string
  trigger?: React.ReactNode
}

/**
 * Dialog component that triggers Alex eligibility analysis
 */
export function AlexAnalysisDialog({
  studentId,
  scholarshipId,
  scholarshipName,
  trigger,
}: AlexAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fetch eligibility analysis when dialog opens
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = trpc.matching.getEligibilityAnalysis.useQuery(
    { studentId, scholarshipId },
    {
      enabled: isOpen, // Only fetch when dialog is open
      retry: 1,
    }
  )

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !analysis && !isLoading) {
      // Trigger fetch when opening
      refetch()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <User2 className="h-4 w-4" />
            Ask Alex for Eligibility Analysis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alex's Eligibility Analysis</DialogTitle>
          <DialogDescription>
            Detailed breakdown of your eligibility for {scholarshipName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 text-center">
                Alex is analyzing your eligibility...
                <br />
                <span className="text-sm">This may take a few seconds</span>
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-800 font-medium mb-2">Failed to load analysis</p>
                <p className="text-red-700 text-sm mb-4">{error.message}</p>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {analysis && !isLoading && !error && (
            <AlexAnalysisReport analysis={analysis} scholarshipName={scholarshipName} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
