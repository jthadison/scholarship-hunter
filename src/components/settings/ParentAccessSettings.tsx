'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, ShieldCheck, ShieldX, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { ParentInviteModal } from './ParentInviteModal'

/**
 * Parent Access Settings Component
 *
 * Allows students to manage parent/guardian access permissions to their data.
 * Students can grant, view, and revoke parent access with granular permissions.
 *
 * Story 5.8: Parent/Guardian View - Task 3 (Student Permission Management UI)
 */
export function ParentAccessSettings() {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [selectedParentName, setSelectedParentName] = useState<string>('')

  const utils = trpc.useUtils()

  // Fetch parents with access
  const { data: parents, isLoading } = trpc.parents.listParents.useQuery()

  // Revoke access mutation
  const { mutate: revokeAccess, isPending: isRevoking } = trpc.parents.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success('Parent access revoked successfully')
      utils.parents.listParents.invalidate()
      setRevokeDialogOpen(false)
      setSelectedParentId(null)
      setSelectedParentName('')
    },
    onError: (error) => {
      toast.error(`Failed to revoke access: ${error.message}`)
    },
  })

  const handleRevokeAccess = (parentId: string, parentEmail: string) => {
    setSelectedParentId(parentId)
    setSelectedParentName(parentEmail)
    setRevokeDialogOpen(true)
  }

  const confirmRevoke = () => {
    if (selectedParentId) {
      revokeAccess({ parentId: selectedParentId })
    }
  }

  if (isLoading) {
    return <SettingsSkeleton />
  }

  const activeParents = parents?.filter((p) => p.accessGranted && !p.revokedAt) || []

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Parents can view your scholarship progress to support you. They cannot edit your
          applications or personal information. You control access and can revoke it at any time.
        </AlertDescription>
      </Alert>

      {/* Grant Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Grant Parent Access
          </CardTitle>
          <CardDescription>
            Invite a parent or guardian to view your scholarship progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Parent
          </Button>
        </CardContent>
      </Card>

      {/* Active Parent Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Parents with Access
          </CardTitle>
          <CardDescription>
            Parents/guardians who currently have access to view your scholarship progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeParents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldX className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No parents have access</p>
              <p className="text-sm">Click "Invite Parent" above to grant access</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeParents.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Parent ID: {access.parentId}</h3>
                    </div>

                    {/* Permissions */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {access.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>

                    {access.grantedAt && (
                      <p className="text-xs text-muted-foreground">
                        Access granted on {new Date(access.grantedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeAccess(access.parentId, access.parentId)}
                    disabled={isRevoking}
                  >
                    Revoke Access
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Parent Modal */}
      <ParentInviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Parent Access?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedParentName} will immediately lose access to your scholarship data. You can
              grant access again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
