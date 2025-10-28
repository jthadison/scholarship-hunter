/**
 * DocumentCard Component
 * Story 4.1: Document Vault - Storage & Organization
 *
 * Displays a document with metadata and actions:
 * - Preview button
 * - Download button
 * - Delete button
 * - Edit metadata
 *
 * @component
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import {
  FileText,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  FileImage,
  FileCode,
} from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import type { Document, DocumentType } from '@prisma/client'

interface DocumentCardProps {
  document: Document & {
    application?: {
      id: string
      scholarship: {
        name: string
      }
    } | null
  }
  onPreview: (documentId: string) => void
  onDelete?: () => void
}

const getDocumentIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return FileImage
  }
  if (mimeType === 'application/pdf') {
    return FileText
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return FileCode
  }
  return FileText
}

const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    TRANSCRIPT: 'Transcript',
    RESUME: 'Resume',
    PERSONAL_STATEMENT: 'Personal Statement',
    FINANCIAL_DOCUMENT: 'Financial',
    RECOMMENDATION_LETTER: 'Recommendation',
    SUPPLEMENTAL_MATERIAL: 'Supplemental',
    OTHER: 'Other',
  }
  return labels[type]
}

export function DocumentCard({
  document,
  onPreview,
  onDelete,
}: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const utils = trpc.useUtils()

  const deleteMutation = trpc.document.deleteDocument.useMutation({
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'The document has been permanently deleted.',
      })
      utils.document.getAll.invalidate()
      utils.document.getStorageUsage.invalidate()
      onDelete?.()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message,
      })
    },
  })

  const handleDownload = async () => {
    try {
      const result = await utils.document.getPreviewUrl.fetch({
        documentId: document.id,
      })

      const response = await fetch(result.signedUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.fileName
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)

      toast({
        title: 'Download started',
        description: `Downloading ${document.fileName}`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'Could not download the file. Please try again.',
      })
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate({ documentId: document.id })
    setShowDeleteDialog(false)
  }

  const Icon = getDocumentIcon(document.mimeType)

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate" title={document.name}>
                    {document.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getDocumentTypeLabel(document.type)}
                  </p>
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(document.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metadata */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Size</span>
                <span>{(document.fileSize / 1024).toFixed(0)} KB</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Uploaded</span>
                <span>{new Date(document.createdAt).toLocaleDateString()}</span>
              </div>
              {document.application && (
                <div className="flex items-center justify-between">
                  <span>Application</span>
                  <span className="truncate max-w-[150px]" title={document.application.scholarship.name}>
                    {document.application.scholarship.name}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {document.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                {document.description}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onPreview(document.id)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.name}"? This action cannot be
              undone and the file will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
