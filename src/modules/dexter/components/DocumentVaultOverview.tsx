/**
 * Document Vault Overview Component
 *
 * Displays document summary statistics with breakdown by category
 * Shows storage usage and version counts
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 8, AC1)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { FileText, FolderOpen, HardDrive } from 'lucide-react'
import Link from 'next/link'
import { DocumentType } from '@prisma/client'

interface DocumentVaultOverviewProps {
  totalDocs: number
  byCategory: Array<{ type: DocumentType; count: number }>
  storageUsed: number
  storageQuota: number
  documentsWithVersions: number
}

export function DocumentVaultOverview({
  totalDocs,
  byCategory,
  storageUsed,
  storageQuota,
  documentsWithVersions,
}: DocumentVaultOverviewProps) {
  const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(1)
  const storageQuotaMB = (storageQuota / (1024 * 1024)).toFixed(0)
  const storagePercentage = Math.round((storageUsed / storageQuota) * 100)

  const documentTypeLabels: Record<DocumentType, string> = {
    TRANSCRIPT: 'Transcripts',
    RESUME: 'Resumes',
    PERSONAL_STATEMENT: 'Personal Statements',
    FINANCIAL_DOCUMENT: 'Financial Docs',
    RECOMMENDATION_LETTER: 'Recommendations',
    SUPPLEMENTAL_MATERIAL: 'Supplemental',
    OTHER: 'Other',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-blue-600" />
          Document Vault Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Documents */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalDocs}</p>
              <p className="text-sm text-gray-600">Total Documents</p>
            </div>
          </div>
          <Link href="/dashboard/documents">
            <Button variant="outline" size="sm">
              Browse Vault
            </Button>
          </Link>
        </div>

        {/* Documents by Category */}
        {byCategory.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">By Category</p>
            <div className="space-y-2">
              {byCategory.map((category) => (
                <div key={category.type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {documentTypeLabels[category.type] || category.type}
                  </span>
                  <span className="font-medium text-gray-900">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version Count */}
        {documentsWithVersions > 0 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Documents with versions</span>
            <span className="text-sm font-semibold text-gray-900">
              {documentsWithVersions}
            </span>
          </div>
        )}

        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Storage Usage</p>
            </div>
            <p className="text-sm text-gray-600">
              {storageUsedMB} / {storageQuotaMB} MB
            </p>
          </div>
          <Progress value={storagePercentage} className="h-2" />
          {storagePercentage >= 80 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Approaching storage limit
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
