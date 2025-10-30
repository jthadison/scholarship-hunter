/**
 * OutcomeForm Component
 *
 * Form for recording or editing scholarship application outcomes.
 * Features:
 * - Outcome result dropdown (AWARDED/DENIED/WAITLISTED/WITHDRAWN)
 * - Conditional award amount field (shown only when AWARDED)
 * - Date picker for decision date
 * - Notes textarea for feedback
 * - Form validation with Zod
 *
 * Story: 5.1 - Outcome Tracking & Status Updates
 * @module components/outcomes/OutcomeForm
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { OutcomeResult } from '@prisma/client'
import { trpc } from '@/shared/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * Outcome form validation schema
 */
const outcomeFormSchema = z.object({
  result: z.nativeEnum(OutcomeResult, {
    required_error: 'Please select an outcome',
  }),
  awardAmountReceived: z.coerce.number().positive().optional(),
  decisionDate: z.string().min(1, 'Decision date is required'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
})

type OutcomeFormData = z.infer<typeof outcomeFormSchema>

interface OutcomeFormProps {
  applicationId: string
  existingOutcome?: {
    id: string
    result: OutcomeResult
    awardAmountReceived: number | null
    decisionDate: Date | null
    notes: string | null
  }
  scholarshipName?: string
  onSuccess: () => void
  onCancel?: () => void
}

const OUTCOME_OPTIONS = [
  {
    value: OutcomeResult.AWARDED,
    label: 'Awarded',
    description: 'You received the scholarship',
    color: 'text-green-600',
  },
  {
    value: OutcomeResult.DENIED,
    label: 'Denied',
    description: 'Application was not selected',
    color: 'text-red-600',
  },
  {
    value: OutcomeResult.WAITLISTED,
    label: 'Waitlisted',
    description: 'Placed on waiting list',
    color: 'text-yellow-600',
  },
  {
    value: OutcomeResult.WITHDRAWN,
    label: 'Withdrawn',
    description: 'You withdrew your application',
    color: 'text-gray-600',
  },
]

export function OutcomeForm({
  applicationId,
  existingOutcome,
  scholarshipName,
  onSuccess,
  onCancel,
}: OutcomeFormProps) {
  const { toast } = useToast()
  const utils = trpc.useUtils()

  const createOutcome = trpc.outcome.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Outcome recorded',
        description: 'Application outcome has been saved successfully.',
      })
      // Invalidate relevant queries
      utils.outcome.getByStudent.invalidate()
      utils.outcome.getHistory.invalidate()
      utils.application.getByStudent.invalidate()
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record outcome. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const updateOutcome = trpc.outcome.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Outcome updated',
        description: 'Application outcome has been updated successfully.',
      })
      // Invalidate relevant queries
      utils.outcome.getByStudent.invalidate()
      utils.outcome.getHistory.invalidate()
      utils.application.getByStudent.invalidate()
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update outcome. Please try again.',
        variant: 'destructive',
      })
    },
  })

  // Get today's date in YYYY-MM-DD format for default value
  const today = new Date().toISOString().split('T')[0]

  const form = useForm<OutcomeFormData>({
    resolver: zodResolver(outcomeFormSchema),
    defaultValues: {
      result: existingOutcome?.result,
      awardAmountReceived: existingOutcome?.awardAmountReceived ?? undefined,
      decisionDate: existingOutcome?.decisionDate
        ? new Date(existingOutcome.decisionDate).toISOString().split('T')[0]
        : today,
      notes: existingOutcome?.notes ?? '',
    },
  })

  const selectedResult = form.watch('result')
  const isAwarded = selectedResult === OutcomeResult.AWARDED

  const handleSubmit = async (data: OutcomeFormData) => {
    try {
      const payload = {
        result: data.result,
        awardAmountReceived: data.awardAmountReceived,
        decisionDate: new Date(data.decisionDate),
        notes: data.notes || undefined,
      }

      if (existingOutcome) {
        await updateOutcome.mutateAsync({
          id: existingOutcome.id,
          ...payload,
        })
      } else {
        await createOutcome.mutateAsync({
          applicationId,
          ...payload,
        })
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Error submitting outcome:', error)
    }
  }

  const isLoading = createOutcome.isPending || updateOutcome.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {scholarshipName && (
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">Scholarship: {scholarshipName}</p>
          </div>
        )}

        {/* Outcome Result Dropdown */}
        <FormField
          control={form.control}
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outcome *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className={`font-medium ${option.color}`}>
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional Award Amount Field */}
        {isAwarded && (
          <FormField
            control={form.control}
            name="awardAmountReceived"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Award Amount Received *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      className="pl-7"
                      min="1"
                      step="1"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter the actual amount you received (may differ from advertised amount)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Decision Date */}
        <FormField
          control={form.control}
          name="decisionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decision Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} max={today} />
              </FormControl>
              <FormDescription>
                When did you receive the decision?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any feedback from the scholarship committee or your own notes..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingOutcome ? 'Update Outcome' : 'Record Outcome'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
