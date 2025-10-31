'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { toast } from 'sonner'
import { ParentPermission } from '@prisma/client'

interface ParentInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Parent Invite Modal Component
 *
 * Modal for students to invite parents/guardians with granular permissions.
 * Allows selection of specific permissions to grant.
 *
 * Story 5.8: Parent/Guardian View - Task 3 (Student Permission Management UI)
 */
export function ParentInviteModal({ open, onOpenChange }: ParentInviteModalProps) {
  const [parentEmail, setParentEmail] = useState('')
  const [permissions, setPermissions] = useState<ParentPermission[]>([
    ParentPermission.VIEW_APPLICATIONS,
    ParentPermission.VIEW_OUTCOMES,
    ParentPermission.VIEW_PROFILE,
    ParentPermission.RECEIVE_NOTIFICATIONS,
  ])

  const utils = trpc.useUtils()

  // Grant access mutation
  const { mutate: grantAccess, isPending } = trpc.parents.grantAccess.useMutation({
    onSuccess: () => {
      toast.success('Parent access granted successfully!')
      utils.parents.listParents.invalidate()
      onOpenChange(false)
      // Reset form
      setParentEmail('')
      setPermissions([
        ParentPermission.VIEW_APPLICATIONS,
        ParentPermission.VIEW_OUTCOMES,
        ParentPermission.VIEW_PROFILE,
        ParentPermission.RECEIVE_NOTIFICATIONS,
      ])
    },
    onError: (error) => {
      toast.error(`Failed to grant access: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!parentEmail) {
      toast.error('Please enter parent email address')
      return
    }

    if (permissions.length === 0) {
      toast.error('Please select at least one permission')
      return
    }

    grantAccess({
      parentEmail,
      permissions,
    })
  }

  const togglePermission = (permission: ParentPermission) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const permissionOptions = [
    {
      value: ParentPermission.VIEW_APPLICATIONS,
      label: 'View Applications',
      description: 'See application pipeline, deadlines, and progress',
    },
    {
      value: ParentPermission.VIEW_OUTCOMES,
      label: 'View Outcomes',
      description: 'See awards received, funding totals, and decision results',
    },
    {
      value: ParentPermission.VIEW_PROFILE,
      label: 'View Profile',
      description: 'See academic profile and extracurricular activities',
    },
    {
      value: ParentPermission.RECEIVE_NOTIFICATIONS,
      label: 'Receive Notifications',
      description: 'Get email alerts for application submissions and awards',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Parent/Guardian</DialogTitle>
            <DialogDescription>
              Enter your parent's email address and select what information they can view.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Parent Email Input */}
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent Email Address</Label>
              <Input
                id="parentEmail"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                The parent must already have a Scholarship Hunter account with the Parent role.
              </p>
            </div>

            {/* Permission Selection */}
            <div className="space-y-3">
              <Label>Permissions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select what information your parent can view
              </p>

              <div className="space-y-3">
                {permissionOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={option.value}
                      checked={permissions.includes(option.value)}
                      onCheckedChange={() => togglePermission(option.value)}
                      disabled={isPending}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Parents have read-only access. They cannot edit your applications, essays, or
                profile. You can revoke access at any time.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !parentEmail || permissions.length === 0}>
              {isPending ? 'Granting Access...' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
