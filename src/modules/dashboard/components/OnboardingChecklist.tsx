'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Check, Circle, Lock } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChecklistItemProps {
  label: string
  completed: boolean
  disabled?: boolean
  href?: string
}

function ChecklistItem({ label, completed, disabled, href }: ChecklistItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        !disabled && !completed && 'hover:bg-muted cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full border-2',
          completed && 'bg-primary border-primary',
          !completed && !disabled && 'border-muted-foreground',
          disabled && 'border-muted'
        )}
      >
        {completed ? (
          <Check className="h-4 w-4 text-primary-foreground" />
        ) : disabled ? (
          <Lock className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Circle className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <span className={cn('flex-1 text-sm font-medium', completed && 'line-through text-muted-foreground')}>
        {label}
      </span>
      {disabled && (
        <Badge variant="outline" className="text-xs">
          Coming Soon
        </Badge>
      )}
    </div>
  )

  if (href && !disabled && !completed) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

interface OnboardingChecklistProps {
  profileCompleted: boolean
  strengthReviewed: boolean
}

export function OnboardingChecklist({
  profileCompleted,
  strengthReviewed,
}: OnboardingChecklistProps) {
  // Don't show checklist if user has completed profile and reviewed strength
  if (profileCompleted && strengthReviewed) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Get Started</span>
          <Badge variant="outline">
            {(profileCompleted ? 1 : 0) + (strengthReviewed ? 1 : 0)} / 4
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ChecklistItem
          label="Complete your profile"
          completed={profileCompleted}
          href="/profile/wizard"
        />
        <ChecklistItem
          label="Review your strength score"
          completed={strengthReviewed}
          href="/dashboard"
        />
        <ChecklistItem
          label="Find scholarships"
          completed={false}
          disabled={true}
        />
        <ChecklistItem
          label="Submit applications"
          completed={false}
          disabled={true}
        />

        {!profileCompleted && (
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/profile/wizard">Complete Your Profile</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
