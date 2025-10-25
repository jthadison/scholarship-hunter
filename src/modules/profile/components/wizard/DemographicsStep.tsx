/**
 * Story 1.8: Demographics Step - Demographics & Financial Need
 * Step 3: Gender, ethnicity, location, citizenship, financial need
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DemographicProfileForm } from '../DemographicProfileForm'
import { FinancialNeedForm } from '../FinancialNeedForm'
import { Users, DollarSign } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface DemographicsStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function DemographicsStep({ formData, onUpdate }: DemographicsStepProps) {
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
          <DemographicProfileForm
            initialData={{
              gender: formData.gender ?? undefined,
              ethnicity: formData.ethnicity ?? undefined,
              city: formData.city ?? undefined,
              state: formData.state ?? undefined,
              zipCode: formData.zipCode ?? undefined,
              citizenshipStatus: formData.citizenshipStatus ?? undefined,
            }}
            onChange={(data) => onUpdate(data)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Need
          </CardTitle>
          <CardDescription>
            Understanding your financial situation helps match you with need-based aid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialNeedForm
            initialData={{
              financialNeedLevel: formData.financialNeedLevel ?? undefined,
              pellGrantEligible: formData.pellGrantEligible ?? undefined,
              efc: formData.efc ?? undefined,
            }}
            onChange={(data) => onUpdate(data)}
          />
        </CardContent>
      </Card>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-900">
          <strong>Privacy Note:</strong> Your demographic and financial information is kept strictly confidential
          and used only to match you with relevant scholarships.
        </p>
      </div>
    </div>
  )
}
