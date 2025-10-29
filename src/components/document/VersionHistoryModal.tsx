/**
 * VersionHistoryModal Component
 * Story 4.2: Document Version Control
 *
 * Displays version history for a document with:
 * - List of all versions (newest first)
 * - Current version badge
 * - View, Download, Restore actions for each version
 * - Version notes display and editing
 *
 * @component
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Separator } from '@/shared/components/ui/separator'
import {
  Eye,
  Download,
  RotateCcw,
  Edit2,
  Clock,
  FileText,
  Check,
  X,
} from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
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

interface VersionHistoryModalProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPreviewVersion?: (versionId: string) => void
}

interface VersionWithStatus {
  id: string
  version: number
  fileName: string
  fileSize: number
  createdAt: Date
  versionNote?: string | null
  isCurrent: boolean
}

export function VersionHistoryModal({
  documentId,
  open,
  onOpenChange,
  onPreviewVersion,
}: VersionHistoryModalProps) {
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null)
  const { toast } = useToast()

  const utils = trpc.useUtils()

  // Get version history
  const { data: versions, isLoading } = trpc.document.getVersionHistory.useQuery(
    { documentId },
    { enabled: open }
  )

  // Update version note mutation
  const updateNoteMutation = trpc.document.updateVersionNote.useMutation({
    onSuccess: () => {
      toast({
        title: 'Note updated',
        description: 'Version note has been saved.',
      })
      utils.document.getVersionHistory.invalidate({ documentId })
      setEditingVersionId(null)
      setEditNote('')
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      })
    },
  })

  // Restore version mutation
  const restoreMutation = trpc.document.restoreVersion.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Version restored',
        description: `Version ${result.restoredFromVersion} has been restored as version ${result.newVersion}.`,
      })
      utils.document.getVersionHistory.invalidate({ documentId })
      utils.document.getAll.invalidate()
      setRestoreVersionId(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Restore failed',
        description: error.message,
      })
    },
  })

  const handleDownload = async (versionId: string, fileName: string) => {
    try {
      const result = await utils.document.getVersionById.fetch({ versionId })

      const response = await fetch(result.signedUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = fileName
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)

      toast({
        title: 'Download started',
        description: `Downloading ${fileName}`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'Could not download the file. Please try again.',
      })
    }
  }

  const handleEditNote = (version: VersionWithStatus) => {
    setEditingVersionId(version.id)
    setEditNote(version.versionNote ?? '')
  }

  const handleSaveNote = () => {
    if (editingVersionId) {
      updateNoteMutation.mutate({
        documentId: editingVersionId,
        versionNote: editNote.trim() || null,
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingVersionId(null)
    setEditNote('')
  }

  const handleRestore = (versionId: string) => {
    setRestoreVersionId(versionId)
  }

  const confirmRestore = () => {
    if (restoreVersionId) {
      const version = versions?.find((v) => v.id === restoreVersionId)
      restoreMutation.mutate({
        versionId: restoreVersionId,
        versionNote: `Restored from version ${version?.version}`,
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and manage all versions of this document
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading version history...</div>
            </div>
          ) : versions && versions.length > 0 ? (
            <ScrollArea className="max-h-[500px] pr-4">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id}>
                    <div className="space-y-3 p-4 rounded-lg border bg-card">
                      {/* Version Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Version {version.version}</span>
                              {version.isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(version.createdAt)}</span>
                              <span>•</span>
                              <span>{formatFileSize(version.fileSize)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPreviewVersion?.(version.id)}
                            title="View version"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(version.id, version.fileName)}
                            title="Download version"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {!version.isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(version.id)}
                              title="Restore this version"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Version Note */}
                      {editingVersionId === version.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Add a note about this version..."
                            className="min-h-[60px]"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveNote}
                              disabled={updateNoteMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={updateNoteMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {version.versionNote ? (
                              <p className="text-sm text-muted-foreground italic">
                                "{version.versionNote}"
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No version note</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(version)}
                            title="Edit note"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {index < versions.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No version history available
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={restoreVersionId !== null}
        onOpenChange={(open) => !open && setRestoreVersionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new version with the content from Version{' '}
              {versions?.find((v) => v.id === restoreVersionId)?.version}. The current
              version will be preserved in the version history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
