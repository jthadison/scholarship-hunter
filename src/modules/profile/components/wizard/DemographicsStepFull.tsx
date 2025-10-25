/**
 * Story 1.8: Demographics Step - Full implementation
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DemographicsStepContent } from './DemographicsStepContent'
import { Users } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface DemographicsStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function DemographicsStepFull({ formData, onUpdate }: DemographicsStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Demographics & Background</h2>
        </div>
        <p className="text-muted-foreground">
          Help us find scholarships designed specifically for students like you
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Many scholarships are awarded to specific demographic groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemographicsStepContent
            defaultValues={{
              gender: formData.gender ?? undefined,
              ethnicity: (formData.ethnicity ?? undefined) as any,
              city: formData.city ?? undefined,
              state: (formData.state ?? undefined) as any,
              zipCode: formData.zipCode ?? undefined,
              citizenship: (formData.citizenship ?? undefined) as any,
            }}
            onChange={(data) => onUpdate(data)}
          />
        </CardContent>
      </Card>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-900">
          <strong>Privacy Note:</strong> Your demographic information is kept strictly confidential
          and used only to match you with relevant scholarships.
        </p>
      </div>
    </div>
  )
}
