'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  academicProfileFormSchema,
  type AcademicProfile,
  CURRENT_GRADE_OPTIONS,
} from '../lib/profile-validation'
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

interface AcademicProfileFormProps {
  defaultValues?: Partial<AcademicProfile>
  onSubmit: (data: AcademicProfile) => void | Promise<void>
}

export function AcademicProfileForm({
  defaultValues,
  onSubmit,
}: AcademicProfileFormProps) {
  const form = useForm({
    resolver: zodResolver(academicProfileFormSchema),
    defaultValues: {
      gpaScale: 4.0,
      ...defaultValues,
    },
  })

  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 7 }, (_, i) => currentYear + i)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* GPA Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Academic Performance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      min="0"
                      max="4.0"
                      placeholder="3.75"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your cumulative GPA. Most US schools use a 4.0 scale.
                  </FormDescription>
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
                  <Select
                    onValueChange={(value) => field.onChange(parseFloat(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scale" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4.0">4.0 Scale (Standard)</SelectItem>
                      <SelectItem value="5.0">5.0 Scale (Weighted)</SelectItem>
                      <SelectItem value="100">100-Point Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your school's GPA scale
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Test Scores Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Scores</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="satScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SAT Score (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="400"
                      max="1600"
                      placeholder="1450"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your highest SAT score (400-1600)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ACT Score (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="36"
                      placeholder="32"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your highest ACT score (1-36). You only need SAT or
                    ACT, not both.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Class Rank Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Class Standing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="classRank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Rank (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="15"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Your class rank (e.g., 15 out of 300)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Size (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="300"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Total number of students in your graduating class
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Graduation Info Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Academic Timeline</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="graduationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Graduation Year</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value) : null)
                    }
                    value={field.value?.toString()}
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
                  <FormDescription>
                    When do you expect to graduate?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Grade Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
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
                  <FormDescription>Your current academic level</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}
