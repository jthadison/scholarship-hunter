/**
 * Story 1.8: Demographics Step - Simplified for wizard
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface DemographicsStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function DemographicsStepSimple({ formData, onUpdate }: DemographicsStepProps) {
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
            Demographics form will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Demographics form integration pending</p>
        </CardContent>
      </Card>
    </div>
  )
}
