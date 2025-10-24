'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FinancialNeed } from '@prisma/client'
import {
  financialProfileSchema,
  type FinancialProfile,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface FinancialNeedFormProps {
  defaultValues?: Partial<FinancialProfile>
  onSubmit: (data: FinancialProfile) => void | Promise<void>
}

const FINANCIAL_NEED_INFO = {
  [FinancialNeed.LOW]: {
    label: 'Low',
    description: 'Family income >$100k, no significant financial hardship',
  },
  [FinancialNeed.MODERATE]: {
    label: 'Moderate',
    description: 'Family income $60k-$100k, some financial need',
  },
  [FinancialNeed.HIGH]: {
    label: 'High',
    description: 'Family income $30k-$60k, significant financial need',
  },
  [FinancialNeed.VERY_HIGH]: {
    label: 'Very High',
    description: 'Family income <$30k, extreme financial need',
  },
}

const EFC_RANGES = [
  '$0-$5,000',
  '$5,001-$10,000',
  '$10,001-$20,000',
  '$20,001-$30,000',
  '$30,000+',
] as const

export function FinancialNeedForm({
  defaultValues,
  onSubmit,
}: FinancialNeedFormProps) {
  const form = useForm<FinancialProfile>({
    resolver: zodResolver(financialProfileSchema),
    defaultValues: {
      pellGrantEligible: false,
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Financial Need Level */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Financial Need Assessment</h3>

          <FormField
            control={form.control}
            name="financialNeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial Need Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select financial need level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(FINANCIAL_NEED_INFO).map(
                      ([value, { label, description }]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {description}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the level that best describes your family's financial
                  situation. This helps match you with need-based scholarships.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pell Grant Eligibility */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Federal Aid Eligibility</h3>

          <FormField
            control={form.control}
            name="pellGrantEligible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Pell Grant Eligible</FormLabel>
                  <FormDescription>
                    Check if you receive or expect to receive a Federal Pell
                    Grant. This is a strong indicator of financial need that
                    many scholarships consider.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* EFC Range */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Expected Family Contribution (EFC)
          </h3>

          <FormField
            control={form.control}
            name="efcRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EFC Range (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select EFC range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EFC_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Your Expected Family Contribution from your FAFSA (if you've
                  completed it). This helps determine financial aid eligibility.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informational Note */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> All financial information is kept strictly
            confidential and encrypted. This information is used solely to match
            you with scholarships that align with your financial circumstances.
          </p>
        </div>
      </form>
    </Form>
  )
}
