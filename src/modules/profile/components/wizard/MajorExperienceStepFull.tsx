/**
 * Story 1.8: Major & Experience Step - Full implementation with simplified content
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { WizardFormData } from '@/modules/profile/hooks/useWizardStore'
import { useState } from 'react'

interface MajorExperienceStepProps {
  formData: WizardFormData
  onUpdate: (data: Partial<WizardFormData>) => void
}

export function MajorExperienceStepFull({ formData, onUpdate }: MajorExperienceStepProps) {
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intendedMajor">
              Intended Major <span className="text-destructive">*</span>
            </Label>
            <Input
              id="intendedMajor"
              placeholder="e.g., Computer Science, Biology, Business Administration"
              value={formData.intendedMajor ?? ''}
              onChange={(e) => onUpdate({ intendedMajor: e.target.value || null })}
            />
            <p className="text-sm text-muted-foreground">
              Required - helps match you with field-specific scholarships
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">
              Field of Study <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.fieldOfStudy ?? ''}
              onValueChange={(value) => onUpdate({ fieldOfStudy: value || null })}
            >
              <SelectTrigger id="fieldOfStudy">
                <SelectValue placeholder="Select your field of study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STEM">STEM</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Humanities">Humanities</SelectItem>
                <SelectItem value="Social Sciences">Social Sciences</SelectItem>
                <SelectItem value="Health Sciences">Health Sciences</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Communications">Communications</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Law">Law</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Required - broad academic category for scholarship matching
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="careerGoals">Career Goals (optional)</Label>
            <Input
              id="careerGoals"
              placeholder="e.g., Software Engineer, Doctor, Entrepreneur"
              value={formData.careerGoals ?? ''}
              onChange={(e) => onUpdate({ careerGoals: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Tip:</strong> Specifying your intended major unlocks field-specific scholarships
          that may have less competition than general scholarships.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extracurricular Activities (optional)</CardTitle>
          <CardDescription>
            Clubs, sports, arts, or other activities you participate in (+3% completion)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExperienceList
            items={formData.extracurriculars as any[] || []}
            onChange={(items) => onUpdate({ extracurriculars: items })}
            placeholder="e.g., Debate Club, Varsity Soccer, School Newspaper"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Experience (optional)</CardTitle>
          <CardDescription>
            Part-time jobs, internships, or professional experience (+3% completion)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExperienceList
            items={formData.workExperience as any[] || []}
            onChange={(items) => onUpdate({ workExperience: items })}
            placeholder="e.g., Barista at Starbucks, Software Intern at Google"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leadership Roles (optional)</CardTitle>
          <CardDescription>
            Positions where you led or organized activities (+3% completion)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExperienceList
            items={formData.leadershipRoles as any[] || []}
            onChange={(items) => onUpdate({ leadershipRoles: items })}
            placeholder="e.g., Student Body President, Team Captain, Club Founder"
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Reusable component for managing list of experience items
interface ExperienceListProps {
  items: Array<{ name: string; description?: string }>
  onChange: (items: Array<{ name: string; description?: string }>) => void
  placeholder: string
}

function ExperienceList({ items, onChange, placeholder }: ExperienceListProps) {
  const [newItemName, setNewItemName] = useState('')

  const addItem = () => {
    if (newItemName.trim()) {
      onChange([...items, { name: newItemName.trim() }])
      setNewItemName('')
    }
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
          <div className="flex-1">
            <p className="font-medium">{item.name}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeItem(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!newItemName.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}
