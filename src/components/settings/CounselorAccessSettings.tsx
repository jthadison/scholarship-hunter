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
import { Shield, ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Counselor Access Settings Component
 *
 * Allows students to manage counselor access permissions to their data.
 * Students can grant, view, and revoke counselor access.
 *
 * Story 5.6: Counselor Portal - Task 10 (Student Permission Management UI)
 */
export function CounselorAccessSettings() {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null)

  const utils = trpc.useUtils()

  // Fetch active counselor access list
  const { data: permissions, isLoading } = trpc.counselor.getMyAccessList.useQuery()

  // Fetch pending requests
  const { data: pendingRequests, isLoading: pendingLoading } =
    trpc.counselor.getPendingRequests.useQuery()

  // Grant access mutation
  const { mutate: grantAccess, isPending: isGranting } = trpc.counselor.grantAccess.useMutation({
    onSuccess: () => {
      toast.success('Access granted successfully')
      utils.counselor.getMyAccessList.invalidate()
      utils.counselor.getPendingRequests.invalidate()
      setGrantDialogOpen(false)
      setSelectedPermissionId(null)
    },
    onError: (error) => {
      toast.error(`Failed to grant access: ${error.message}`)
    },
  })

  // Revoke access mutation
  const { mutate: revokeAccess, isPending: isRevoking } = trpc.counselor.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success('Access revoked successfully')
      utils.counselor.getMyAccessList.invalidate()
      setRevokeDialogOpen(false)
      setSelectedPermissionId(null)
    },
    onError: (error) => {
      toast.error(`Failed to revoke access: ${error.message}`)
    },
  })

  const handleGrantAccess = (permissionId: string) => {
    setSelectedPermissionId(permissionId)
    setGrantDialogOpen(true)
  }

  const handleRevokeAccess = (permissionId: string) => {
    setSelectedPermissionId(permissionId)
    setRevokeDialogOpen(true)
  }

  const confirmGrant = () => {
    if (selectedPermissionId) {
      grantAccess({ permissionId: selectedPermissionId })
    }
  }

  const confirmRevoke = () => {
    if (selectedPermissionId) {
      revokeAccess({ permissionId: selectedPermissionId })
    }
  }

  if (isLoading || pendingLoading) {
    return <SettingsSkeleton />
  }

  const activePermissions = permissions?.filter((p) => p.status === 'ACTIVE') || []
  const pending = pendingRequests || []

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your counselor can view your scholarship progress to provide support. They cannot edit
          your applications or personal information. You can revoke access at any time.
        </AlertDescription>
      </Alert>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Access Requests
            </CardTitle>
            <CardDescription>
              Review counselor access requests and grant or deny permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {request.counselor.firstName} {request.counselor.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {request.counselor.schoolName}
                    {request.counselor.schoolDistrict &&
                      ` • ${request.counselor.schoolDistrict}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {request.counselor.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeAccess(request.id)}
                    disabled={isRevoking}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleGrantAccess(request.id)}
                    disabled={isGranting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Grant Access
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Counselor Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Counselors with Access
          </CardTitle>
          <CardDescription>
            Counselors who currently have access to view your scholarship progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePermissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldX className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No counselors have access</p>
              <p className="text-sm">
                When a counselor requests access, you'll see their request above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {permission.counselor.firstName} {permission.counselor.lastName}
                      </h3>
                      <Badge variant="secondary">{permission.permissionLevel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {permission.counselor.schoolName}
                      {permission.counselor.schoolDistrict &&
                        ` • ${permission.counselor.schoolDistrict}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {permission.counselor.email}
                    </p>
                    {permission.grantedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Access granted on{' '}
                        {new Date(permission.grantedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeAccess(permission.id)}
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

      {/* Grant Access Confirmation Dialog */}
      <AlertDialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant Counselor Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow the counselor to view your scholarship progress, applications, and
              outcomes. They will not be able to edit your data. You can revoke access at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGranting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGrant} disabled={isGranting}>
              {isGranting ? 'Granting...' : 'Grant Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Counselor Access?</AlertDialogTitle>
            <AlertDialogDescription>
              The counselor will immediately lose access to your scholarship data. You can grant
              access again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke} disabled={isRevoking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
