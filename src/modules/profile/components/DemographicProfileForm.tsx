'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  demographicProfileSchema,
  type DemographicProfile,
  US_STATES,
  ETHNICITY_OPTIONS,
  CITIZENSHIP_OPTIONS,
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
import { Checkbox } from '@/components/ui/checkbox'

interface DemographicProfileFormProps {
  defaultValues?: Partial<DemographicProfile>
  onSubmit: (data: DemographicProfile) => void | Promise<void>
}

export function DemographicProfileForm({
  defaultValues,
  onSubmit,
}: DemographicProfileFormProps) {
  const form = useForm({
    resolver: zodResolver(demographicProfileSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Female, Male, Non-binary, or other"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Enter your gender identity. This is optional and helps match
                  you with relevant scholarships.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ethnicity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ethnicity (Optional)</FormLabel>
                <FormDescription className="mb-3">
                  Select all that apply. This helps match you with scholarships
                  for underrepresented groups.
                </FormDescription>
                <div className="space-y-2">
                  {ETHNICITY_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value?.includes(option) ?? false}
                        onCheckedChange={(checked) => {
                          const current = field.value ?? []
                          if (checked) {
                            field.onChange([...current, option])
                          } else {
                            field.onChange(
                              current.filter((val) => val !== option)
                            )
                          }
                        }}
                      />
                      <label className="text-sm font-normal cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Location</h3>

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
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
                <FormDescription>
                  Many scholarships have state residency requirements
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Los Angeles"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>Your city of residence</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="90210 or 90210-1234"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>5 or 9 digit ZIP code</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Citizenship Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Citizenship Status</h3>

          <FormField
            control={form.control}
            name="citizenship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Citizenship</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
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
                <FormDescription>
                  Many scholarships have citizenship requirements. This
                  information helps match you with eligible opportunities.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}
