/**
 * Story 1.8: Academic Step Content - Simplified form for wizard
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import {
  academicProfileFormSchema,
  type AcademicProfile,
  CURRENT_GRADE_OPTIONS,
} from '@/modules/profile/lib/profile-validation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AcademicStepContentProps {
  defaultValues?: Partial<AcademicProfile>
  onChange: (data: Partial<AcademicProfile>) => void
}

export function AcademicStepContent({ defaultValues, onChange }: AcademicStepContentProps) {
  const form = useForm({
    resolver: zodResolver(academicProfileFormSchema.partial()),
    defaultValues: {
      gpaScale: 4.0,
      ...defaultValues,
    },
  })

  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 7 }, (_, i) => currentYear + i)

  // Watch for changes and call onChange
  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange(values as Partial<AcademicProfile>)
    })
    return () => subscription.unsubscribe()
  }, [form, onChange])

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* GPA Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gpa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GPA</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.75"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gpaScale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GPA Scale</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="4.0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Test Scores */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="satScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SAT Score (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1450"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormDescription>Total score (400-1600)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ACT Score (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="32"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormDescription>Composite score (1-36)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Class Rank */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="classRank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Rank (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="15"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="classSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Size (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="250"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Current Grade & Graduation Year */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currentGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Grade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENT_GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="graduationYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Graduation Year</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() ?? ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {graduationYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  )
}
