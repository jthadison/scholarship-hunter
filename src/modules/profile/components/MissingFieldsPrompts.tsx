'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, Plus } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import type { MissingField } from '../types'

interface MissingFieldsPromptsProps {
  /**
   * Maximum number of prompts to show (default: 5)
   */
  limit?: number
  /**
   * Callback when a prompt is clicked to add the field
   */
  onAddField?: (fieldName: string) => void
  /**
   * Show on dashboard if completion <80% (contextual placement)
   */
  contextual?: boolean
}

/**
 * Story 1.6: Missing Fields Prompt Component
 * Displays prioritized list of missing fields with prompts
 */
export function MissingFieldsPrompts({ limit = 5, onAddField, contextual }: MissingFieldsPromptsProps) {
  const { data: missingFields, isLoading } = trpc.profile.getMissingFields.useQuery()
  const { data: completeness } = trpc.profile.getCompleteness.useQuery()
  const [dismissedFields, setDismissedFields] = useState<Set<string>>(new Set())

  // Don't show if contextual mode and completion >= 80%
  if (contextual && completeness && completeness.completionPercentage >= 80) {
    return null
  }

  if (isLoading || !missingFields) {
    return null
  }

  // Filter out dismissed fields and limit display
  const visibleFields = missingFields
    .filter((field: MissingField) => !dismissedFields.has(field.field))
    .slice(0, limit)

  if (visibleFields.length === 0) {
    return null
  }

  const handleDismiss = (fieldName: string) => {
    setDismissedFields((prev) => new Set([...prev, fieldName]))
    // TODO: Store in user preferences/localStorage
  }

  const requiredFields = visibleFields.filter((f: MissingField) => f.isRequired)
  const recommendedFields = visibleFields.filter((f: MissingField) => !f.isRequired)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Improve Your Profile</CardTitle>
        <CardDescription>
          Add these fields to increase your scholarship matches
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Fields Section */}
        {requiredFields.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              <span className="text-sm text-muted-foreground">
                {requiredFields.length} field{requiredFields.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {requiredFields.map((field: MissingField) => (
                <MissingFieldPromptItem
                  key={field.field}
                  field={field}
                  onAdd={onAddField}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Fields Section */}
        {recommendedFields.length > 0 && (
          <div className="space-y-3">
            {requiredFields.length > 0 && <div className="border-t pt-3" />}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Recommended</Badge>
              <span className="text-sm text-muted-foreground">
                {recommendedFields.length} field{recommendedFields.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {recommendedFields.map((field: MissingField) => (
                <MissingFieldPromptItem
                  key={field.field}
                  field={field}
                  onAdd={onAddField}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          </div>
        )}

        {/* Show All Link */}
        {missingFields.length > limit && (
          <div className="pt-2 text-center">
            <Button variant="link" size="sm" className="text-xs">
              Show all {missingFields.length} missing fields
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual missing field prompt item
 */
function MissingFieldPromptItem({
  field,
  onAdd,
  onDismiss,
}: {
  field: MissingField
  onAdd?: (fieldName: string) => void
  onDismiss: (fieldName: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative flex items-start gap-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onAdd?.(field.field)}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.label}</span>
          <Badge variant="outline" className="text-xs">
            {field.estimatedImpact}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{field.prompt}</p>
        <p className="text-xs text-muted-foreground italic">
          Category: {field.category}
        </p>
      </div>

      {/* Add Button (visible on hover) */}
      {isHovered && onAdd && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onAdd(field.field)
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {/* Dismiss Button (visible on hover for optional fields) */}
      {isHovered && !field.isRequired && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onDismiss(field.field)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
