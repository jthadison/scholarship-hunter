'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  intendedMajorSchema,
  fieldOfStudySchema,
  careerGoalsSchema,
  getFieldOfStudyFromMajor,
} from '../lib/profile-validation'
import majorsData from '../../../data/majors.json'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================================================
// Schema & Types
// ============================================================================

const majorFieldFormSchema = z.object({
  intendedMajor: intendedMajorSchema,
  fieldOfStudy: fieldOfStudySchema,
  careerGoals: careerGoalsSchema,
})

type MajorFieldFormData = z.infer<typeof majorFieldFormSchema>

// ============================================================================
// Component Props
// ============================================================================

interface MajorFieldFormProps {
  initialData?: Partial<MajorFieldFormData>
  onSubmit: (data: MajorFieldFormData) => void | Promise<void>
  isLoading?: boolean
}

// ============================================================================
// Major & Field of Study Form Component
// ============================================================================

export function MajorFieldForm({
  initialData,
  onSubmit,
  isLoading = false,
}: MajorFieldFormProps) {
  const [customMajor, setCustomMajor] = useState('')

  const form = useForm<MajorFieldFormData>({
    resolver: zodResolver(majorFieldFormSchema),
    defaultValues: {
      intendedMajor: initialData?.intendedMajor || null,
      fieldOfStudy: initialData?.fieldOfStudy || null,
      careerGoals: initialData?.careerGoals || null,
    },
  })

  // Extract majors grouped by field
  const majorsByField = useMemo(() => {
    const data = majorsData as any
    return data.fields
  }, [])

  // Handle major selection
  const handleMajorChange = (value: string) => {
    if (value === 'Other') {
      form.setValue('intendedMajor', 'Other')
      form.setValue('fieldOfStudy', 'Other')
    } else if (value === 'custom') {
      // Show custom input
      setCustomMajor('')
    } else {
      form.setValue('intendedMajor', value)
      // Auto-populate field of study
      const field = getFieldOfStudyFromMajor(value)
      form.setValue('fieldOfStudy', field as any)
    }
  }

  // Handle custom major entry
  const handleCustomMajorSave = () => {
    if (customMajor.trim()) {
      form.setValue('intendedMajor', customMajor)
      form.setValue('fieldOfStudy', 'Other')
    }
  }

  const selectedFieldOfStudy = form.watch('fieldOfStudy')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Major Selection */}
        <FormField
          control={form.control}
          name="intendedMajor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intended Major</FormLabel>
              <Select
                value={field.value || ''}
                onValueChange={handleMajorChange}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your intended major" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(majorsByField).map(([fieldKey, fieldData]: [string, any]) => (
                    <SelectGroup key={fieldKey}>
                      <SelectLabel>{fieldData.name}</SelectLabel>
                      {fieldData.majors.map((major: string) => (
                        <SelectItem key={major} value={major}>
                          {major}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectLabel>Other Options</SelectLabel>
                    <SelectItem value="custom">Enter custom major...</SelectItem>
                    <SelectItem value="Other">Undecided</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                Select your intended college major or field of study
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Major Input */}
        {form.watch('intendedMajor') === 'custom' && (
          <div className="space-y-2">
            <Label>Custom Major</Label>
            <div className="flex gap-2">
              <Input
                value={customMajor}
                onChange={(e) => setCustomMajor(e.target.value)}
                placeholder="Enter your major"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleCustomMajorSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                disabled={isLoading || !customMajor.trim()}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Field of Study Display */}
        {selectedFieldOfStudy && selectedFieldOfStudy !== 'Other' && (
          <div className="rounded-md bg-muted p-4">
            <Label className="text-sm font-medium">Field of Study</Label>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {selectedFieldOfStudy}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Automatically categorized based on your selected major
            </p>
          </div>
        )}

        {/* Career Goals */}
        <FormField
          control={form.control}
          name="careerGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Career Goals (Optional)</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  value={field.value || ''}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Briefly describe your career aspirations..."
                  maxLength={500}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0} / 500 characters
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
          {isLoading ? 'Saving...' : 'Save Major & Career Goals'}
        </button>
      </form>
    </Form>
  )
}
