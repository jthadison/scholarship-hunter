/**
 * Story 1.8: Special Circumstances Step - Simplified
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface SpecialCircumstancesStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function SpecialCircumstancesStepSimple({ }: SpecialCircumstancesStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Special Circumstances</h2>
        </div>
        <p className="text-muted-foreground">
          Unique backgrounds and circumstances (all optional)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Background & Circumstances</CardTitle>
          <CardDescription>
            Special circumstances form will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Special circumstances form integration pending</p>
        </CardContent>
      </Card>
    </div>
  )
}
