/**
 * Compliance Status Grid Component
 *
 * Displays compliance summary by application with color coding
 * Shows required vs uploaded documents and action items
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 4, AC1, AC2)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react'
import Link from 'next/link'
import { DocumentType } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

interface ComplianceApplication {
  applicationId: string
  scholarshipName: string
  deadline: Date
  requiredDocsCount: number
  uploadedDocsCount: number
  compliantDocsCount: number
  status: 'COMPLIANT' | 'MISSING_DOCS' | 'VIOLATIONS' | 'INCOMPLETE'
  missingTypes: DocumentType[]
  violations: Array<{
    documentId: string
    name: string
    type: DocumentType
    errors: any
  }>
}

interface ComplianceStatusGridProps {
  applications: ComplianceApplication[]
  summary: {
    totalApplications: number
    compliantApplications: number
    percentageCompliant: number
  }
}

export function ComplianceStatusGrid({ applications, summary }: ComplianceStatusGridProps) {
  const getStatusBadge = (status: ComplianceApplication['status']) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Compliant
          </Badge>
        )
      case 'MISSING_DOCS':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Missing Docs
          </Badge>
        )
      case 'VIOLATIONS':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Violations
          </Badge>
        )
      case 'INCOMPLETE':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Incomplete
          </Badge>
        )
    }
  }

  const getStatusColor = (status: ComplianceApplication['status']) => {
    switch (status) {
      case 'COMPLIANT':
        return 'border-l-4 border-l-green-500'
      case 'MISSING_DOCS':
        return 'border-l-4 border-l-yellow-500'
      case 'VIOLATIONS':
        return 'border-l-4 border-l-red-500'
      case 'INCOMPLETE':
        return 'border-l-4 border-l-orange-500'
    }
  }

  const documentTypeLabels: Record<DocumentType, string> = {
    TRANSCRIPT: 'Transcript',
    RESUME: 'Resume',
    PERSONAL_STATEMENT: 'Personal Statement',
    FINANCIAL_DOCUMENT: 'Financial Document',
    RECOMMENDATION_LETTER: 'Recommendation',
    SUPPLEMENTAL_MATERIAL: 'Supplemental',
    OTHER: 'Other',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Compliance Status by Application
          </CardTitle>
          <div className="text-sm text-gray-600">
            {summary.compliantApplications} of {summary.totalApplications} compliant (
            {summary.percentageCompliant}%)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No active applications found</p>
            <Link href="/dashboard/applications">
              <Button variant="outline" size="sm" className="mt-3">
                Browse Scholarships
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.applicationId}
                className={`p-4 bg-gray-50 rounded-lg ${getStatusColor(app.status)}`}
              >
                {/* Application Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">
                      {app.scholarshipName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Due {formatDistanceToNow(new Date(app.deadline), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">{getStatusBadge(app.status)}</div>
                </div>

                {/* Document Counts */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Documents:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {app.uploadedDocsCount} / {app.requiredDocsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Compliant:</span>{' '}
                    <span className="font-medium text-gray-900">{app.compliantDocsCount}</span>
                  </div>
                </div>

                {/* Missing Documents */}
                {app.missingTypes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Missing:</p>
                    <div className="flex flex-wrap gap-1">
                      {app.missingTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {documentTypeLabels[type]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Violations */}
                {app.violations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-red-700 mb-1">
                      {app.violations.length} compliance{' '}
                      {app.violations.length === 1 ? 'issue' : 'issues'}
                    </p>
                    <div className="text-xs text-gray-600">
                      {app.violations.map((v) => v.name).join(', ')}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Link href={`/dashboard/applications/${app.applicationId}/documents`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
