'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  militaryAffiliationSchema,
  disabilitiesSchema,
  additionalContextSchema,
} from '../lib/profile-validation'
import { MILITARY_AFFILIATIONS } from '../types'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================================================
// Schema & Types
// ============================================================================

const specialCircumstancesSchema = z.object({
  firstGeneration: z.boolean(),
  militaryAffiliation: militaryAffiliationSchema,
  disabilities: disabilitiesSchema,
  additionalContext: additionalContextSchema,
})

type SpecialCircumstancesFormData = z.infer<typeof specialCircumstancesSchema>

// ============================================================================
// Component Props
// ============================================================================

interface SpecialCircumstancesFormProps {
  initialData?: Partial<SpecialCircumstancesFormData>
  onSubmit: (data: SpecialCircumstancesFormData) => void | Promise<void>
  isLoading?: boolean
}

// ============================================================================
// Special Circumstances Form Component
// ============================================================================

export function SpecialCircumstancesForm({
  initialData,
  onSubmit,
  isLoading = false,
}: SpecialCircumstancesFormProps) {
  const form = useForm<SpecialCircumstancesFormData>({
    resolver: zodResolver(specialCircumstancesSchema),
    defaultValues: {
      firstGeneration: initialData?.firstGeneration ?? false,
      militaryAffiliation: initialData?.militaryAffiliation ?? 'None',
      disabilities: initialData?.disabilities ?? null,
      additionalContext: initialData?.additionalContext ?? null,
    },
    mode: 'onChange',
  })

  const additionalContextValue = form.watch('additionalContext')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Privacy Notice */}
        <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">Privacy Notice</h4>
          <p className="text-sm text-blue-800">
            This information is private and used only for matching scholarships. All fields are optional.
          </p>
        </div>

        {/* First-Generation Student */}
        <FormField
          control={form.control}
          name="firstGeneration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>First-Generation College Student</FormLabel>
                <FormDescription>
                  Check if neither parent completed a 4-year college degree. Many scholarships are specifically for first-generation students.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Military Affiliation */}
        <FormField
          control={form.control}
          name="militaryAffiliation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Military Affiliation</FormLabel>
              <Select value={field.value || 'None'} onValueChange={field.onChange} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select military affiliation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MILITARY_AFFILIATIONS.map((affiliation) => (
                    <SelectItem key={affiliation} value={affiliation}>
                      {affiliation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Many scholarships are available for military-connected students
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Disabilities */}
        <FormField
          control={form.control}
          name="disabilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disabilities (Optional)</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  value={field.value || ''}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., Physical, Visual, Hearing, Learning, Cognitive, Mental Health, Chronic Illness"
                  maxLength={200}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Optional. Examples: Physical, Visual, Hearing, Learning, Cognitive, Mental Health, Chronic Illness. {field.value?.length || 0} / 200 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Context */}
        <FormField
          control={form.control}
          name="additionalContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Context (Optional)</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  value={field.value || ''}
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Share any other unique circumstances that may help with scholarship matching (e.g., foster youth, refugee, low-income, rural community, single-parent household, etc.)"
                  maxLength={2000}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription className="flex items-center justify-between">
                <span>Describe any special circumstances that may qualify you for specific scholarships</span>
                <span className="font-medium">
                  {additionalContextValue?.length || 0} / 2000
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Special Circumstances'}
        </button>
      </form>
    </Form>
  )
}
