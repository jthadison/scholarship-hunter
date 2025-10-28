/**
 * DocumentPreview Component
 * Story 4.1: Document Vault - Storage & Organization
 *
 * Preview modal for documents with:
 * - PDF inline preview (iframe)
 * - Image preview with zoom
 * - DOCX/other file download
 * - Download and close actions
 *
 * @component
 */

'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, FileText, X } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'

interface DocumentPreviewProps {
  documentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentPreview({
  documentId,
  open,
  onOpenChange,
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Fetch signed URL when modal opens
  const { data, isLoading, error } = trpc.document.getPreviewUrl.useQuery(
    { documentId: documentId! },
    {
      enabled: !!documentId && open,
    }
  )

  useEffect(() => {
    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl)
    }
  }, [data])

  const handleDownload = async () => {
    if (!previewUrl) return

    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data?.document.fileName ?? 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const isPDF = data?.document.mimeType === 'application/pdf'
  const isImage = data?.document.mimeType.startsWith('image/')
  const canPreview = isPDF || isImage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{data?.document.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4" />
                <span>{data?.document.fileName}</span>
                <span>•</span>
                <span>{data?.document.fileSize ? `${(data.document.fileSize / 1024).toFixed(0)} KB` : ''}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <FileText className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">Failed to load preview</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          )}

          {!isLoading && !error && previewUrl && (
            <>
              {isPDF && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] border rounded-lg"
                  title="PDF Preview"
                />
              )}

              {isImage && (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={previewUrl}
                    alt={data?.document.name}
                    className="max-w-full max-h-[600px] rounded-lg shadow-lg object-contain"
                  />
                </div>
              )}

              {!canPreview && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Preview not available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download to view
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!previewUrl}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
