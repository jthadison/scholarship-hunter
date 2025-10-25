/**
 * Story 1.8: Major & Experience Step
 * Step 4: Intended major, extracurriculars, work experience
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MajorFieldForm } from '../MajorFieldForm'
import { ExtracurricularForm } from '../ExtracurricularForm'
import { Briefcase, BookOpen } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'

interface MajorExperienceStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function MajorExperienceStep({ formData, onUpdate }: MajorExperienceStepProps) {
  const [showExtracurriculars, setShowExtracurriculars] = useState(
    (formData.extracurriculars?.length ?? 0) > 0
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Major & Experience</h2>
        </div>
        <p className="text-muted-foreground">
          Your academic interests and activities help match field-specific scholarships
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Interests</CardTitle>
          <CardDescription>
            What do you plan to study in college?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MajorFieldForm
            initialData={{
              intendedMajor: formData.intendedMajor ?? undefined,
              fieldOfStudy: formData.fieldOfStudy ?? undefined,
              careerGoals: formData.careerGoals ?? undefined,
            }}
            onChange={(data) => onUpdate(data)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Activities & Experience
          </CardTitle>
          <CardDescription>
            Extracurriculars and leadership roles strengthen your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={showExtracurriculars} onOpenChange={setShowExtracurriculars}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>
                  {(formData.extracurriculars?.length ?? 0) > 0
                    ? `${formData.extracurriculars?.length} activities added`
                    : 'Add extracurricular activities (optional)'}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showExtracurriculars ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <ExtracurricularForm
                initialData={{
                  extracurriculars: formData.extracurriculars ?? [],
                }}
                onChange={(data) => onUpdate(data)}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="text-sm text-muted-foreground">
            Don't worry if you haven't added many activities yet. You can always add more later!
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Did you know?</strong> Leadership roles and community service can significantly boost your scholarship
          opportunities, even if your GPA isn't perfect. Quality matters more than quantity!
        </p>
      </div>
    </div>
  )
}
