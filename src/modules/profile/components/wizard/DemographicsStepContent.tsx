/**
 * Story 1.8: Demographics Step Content - Auto-updating form for wizard
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import {
  demographicProfileSchema,
  type DemographicProfile,
  US_STATES,
  ETHNICITY_OPTIONS,
  CITIZENSHIP_OPTIONS,
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
import { Checkbox } from '@/components/ui/checkbox'

interface DemographicsStepContentProps {
  defaultValues?: Partial<DemographicProfile>
  onChange: (data: Partial<DemographicProfile>) => void
}

export function DemographicsStepContent({ defaultValues, onChange }: DemographicsStepContentProps) {
  const form = useForm({
    resolver: zodResolver(demographicProfileSchema.partial()),
    defaultValues: defaultValues || {},
  })

  // Watch for changes and call onChange
  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange(values as Partial<DemographicProfile>)
    })
    return () => subscription.unsubscribe()
  }, [form, onChange])

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Female, Male, Non-binary, or other"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Enter your gender identity. This is optional and helps match you with relevant scholarships.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ethnicity (multi-select) */}
        <FormField
          control={form.control}
          name="ethnicity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ethnicity (select all that apply)</FormLabel>
              <FormDescription>
                Many scholarships are specifically for students of certain ethnic backgrounds
              </FormDescription>
              <div className="space-y-2">
                {ETHNICITY_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      checked={(field.value || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || []
                        if (checked) {
                          field.onChange([...currentValue, option])
                        } else {
                          field.onChange(currentValue.filter((v: string) => v !== option))
                        }
                      }}
                    />
                    <label className="text-sm">{option}</label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* State */}
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Required for state-specific scholarships</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Los Angeles" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ZIP Code */}
        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code (optional)</FormLabel>
              <FormControl>
                <Input placeholder="90210" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Citizenship */}
        <FormField
          control={form.control}
          name="citizenship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Citizenship Status <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select citizenship status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CITIZENSHIP_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Required - many scholarships have citizenship requirements</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}
