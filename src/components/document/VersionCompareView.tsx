/**
 * VersionCompareView Component
 * Story 4.2: Document Version Control
 *
 * Side-by-side comparison of two document versions showing:
 * - Version metadata (number, date, size)
 * - File size difference
 * - Version notes
 *
 * @component
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { FileText, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'

interface VersionCompareViewProps {
  versionId1: string
  versionId2: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionCompareView({
  versionId1,
  versionId2,
  open,
  onOpenChange,
}: VersionCompareViewProps) {
  // Fetch both versions
  const { data: version1 } = trpc.document.getVersionById.useQuery(
    { versionId: versionId1 },
    { enabled: open && !!versionId1 }
  )

  const { data: version2 } = trpc.document.getVersionById.useQuery(
    { versionId: versionId2 },
    { enabled: open && !!versionId2 }
  )

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

  const calculateSizeDifference = () => {
    if (!version1 || !version2) return null

    const diff = version2.document.fileSize - version1.document.fileSize
    const diffKB = (Math.abs(diff) / 1024).toFixed(1)

    if (diff > 0) {
      return {
        text: `${diffKB} KB larger`,
        icon: TrendingUp,
        color: 'text-orange-500',
      }
    } else if (diff < 0) {
      return {
        text: `${diffKB} KB smaller`,
        icon: TrendingDown,
        color: 'text-green-500',
      }
    }
    return {
      text: 'Same size',
      icon: FileText,
      color: 'text-muted-foreground',
    }
  }

  const sizeDiff = calculateSizeDifference()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compare Versions</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of document versions
          </DialogDescription>
        </DialogHeader>

        {version1 && version2 ? (
          <div className="space-y-6">
            {/* Version Headers */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Version {version1.document.version}
                    {version1.isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {formatDate(version1.document.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">
                        {formatFileSize(version1.document.fileSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <span className="font-medium truncate max-w-[150px]" title={version1.document.fileName}>
                        {version1.document.fileName}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Version Note:</span>
                    {version1.document.versionNote ? (
                      <p className="text-sm italic">"{version1.document.versionNote}"</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No note</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Version {version2.document.version}
                    {version2.isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {formatDate(version2.document.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">
                        {formatFileSize(version2.document.fileSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <span className="font-medium truncate max-w-[150px]" title={version2.document.fileName}>
                        {version2.document.fileName}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Version Note:</span>
                    {version2.document.versionNote ? (
                      <p className="text-sm italic">"{version2.document.versionNote}"</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No note</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Differences */}
            {sizeDiff && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Differences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">File Size:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        Version {version1.document.version}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Version {version2.document.version}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ml-auto ${sizeDiff.color}`}>
                      {sizeDiff.icon && <sizeDiff.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{sizeDiff.text}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Future Enhancement Placeholder */}
            <Card className="border-dashed">
              <CardContent className="py-6">
                <div className="text-center text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Content Comparison</p>
                  <p>
                    Text content comparison will be available in a future update for
                    supported file types.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading comparison...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
