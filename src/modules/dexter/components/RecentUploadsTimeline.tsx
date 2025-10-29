/**
 * Recent Uploads Timeline Component
 *
 * Displays last 10 document uploads with timestamps and compliance status
 * Groups uploads by date for better organization
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 9, AC1)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { DocumentType } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

interface RecentUpload {
  id: string
  name: string
  type: DocumentType
  fileName: string
  fileSize: number
  createdAt: Date
  compliant: boolean
  applicationName?: string | null
}

interface RecentUploadsTimelineProps {
  uploads: RecentUpload[]
}

export function RecentUploadsTimeline({ uploads }: RecentUploadsTimelineProps) {
  // Group uploads by date category
  const groupedUploads = groupByDateCategory(uploads)

  const documentTypeIcons: Record<DocumentType, string> = {
    TRANSCRIPT: '📄',
    RESUME: '📝',
    PERSONAL_STATEMENT: '✍️',
    FINANCIAL_DOCUMENT: '💰',
    RECOMMENDATION_LETTER: '✉️',
    SUPPLEMENTAL_MATERIAL: '📎',
    OTHER: '📁',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No documents uploaded yet</p>
            <Link href="/dashboard/documents/upload">
              <Button variant="outline" size="sm" className="mt-3">
                Upload Your First Document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedUploads).map(([category, categoryUploads]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {category}
                </h4>
                <div className="space-y-3">
                  {categoryUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {/* Document Type Icon */}
                      <div className="text-2xl">{documentTypeIcons[upload.type]}</div>

                      {/* Document Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{upload.name}</p>
                          {upload.compliant ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>
                            {formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(upload.fileSize)}</span>
                          {upload.applicationName && (
                            <>
                              <span>•</span>
                              <span className="truncate">{upload.applicationName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* View Button */}
                      <Link href={`/dashboard/documents/${upload.id}`}>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper: Group uploads by date category (Today, This Week, Earlier)
function groupByDateCategory(uploads: RecentUpload[]): Record<string, RecentUpload[]> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const grouped: Record<string, RecentUpload[]> = {
    Today: [],
    'This Week': [],
    Earlier: [],
  }

  uploads.forEach((upload) => {
    const uploadDate = new Date(upload.createdAt)
    if (uploadDate >= today) {
      grouped.Today?.push(upload)
    } else if (uploadDate >= lastWeek) {
      grouped['This Week']?.push(upload)
    } else {
      grouped.Earlier?.push(upload)
    }
  })

  // Remove empty categories
  Object.keys(grouped).forEach((key) => {
    if (grouped[key] && grouped[key]!.length === 0) {
      delete grouped[key]
    }
  })

  return grouped
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i]
}
