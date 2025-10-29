/**
 * Compliance Report Page
 * Story 4.3: Document Compliance Validation
 *
 * Displays detailed compliance report for application documents:
 * - Overall compliance summary
 * - Document-by-document table
 * - Specific errors and suggested fixes
 * - Re-validate button
 *
 * Route: /dashboard/applications/[id]/compliance
 */

'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/shared/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ComplianceStatusBadge } from '@/components/document/ComplianceStatusBadge'
import { RefreshCw, ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { DocumentType } from '@prisma/client'
import { useToast } from '@/hooks/use-toast'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    TRANSCRIPT: 'Transcript',
    RESUME: 'Resume',
    PERSONAL_STATEMENT: 'Personal Statement',
    FINANCIAL_DOCUMENT: 'Financial Document',
    RECOMMENDATION_LETTER: 'Recommendation Letter',
    SUPPLEMENTAL_MATERIAL: 'Supplemental Material',
    OTHER: 'Other',
  }
  return labels[type]
}

export default function ComplianceReportPage({ params }: PageProps) {
  const { id: applicationId } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const { data: report, isLoading, refetch } = trpc.application.validateCompliance.useQuery(
    { applicationId },
    {
      refetchOnWindowFocus: false,
    }
  )


  const handleRevalidate = async () => {
    toast({
      title: 'Revalidating documents...',
      description: 'Checking compliance status',
    })

    await refetch()

    toast({
      title: 'Validation complete',
      description: report?.compliant
        ? 'All documents are compliant!'
        : 'Some issues were found',
      variant: report?.compliant ? 'default' : 'destructive',
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Application not found</p>
        </div>
      </div>
    )
  }

  const compliancePercentage = report.totalDocuments > 0
    ? Math.round((report.compliantDocuments / report.totalDocuments) * 100)
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/applications/${applicationId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Compliance Report</h1>
          <p className="text-muted-foreground">
            Application #{applicationId.slice(0, 8)}
          </p>
        </div>

        <Button onClick={handleRevalidate} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-validate
        </Button>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {report.compliant ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className="text-2xl font-bold">
                    {report.compliantDocuments} of {report.totalDocuments} compliant
                  </p>
                  <p className="text-muted-foreground">
                    {compliancePercentage}% compliance rate
                  </p>
                </div>
              </div>
            </div>

            {report.compliant ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ready to Submit
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Needs Attention
              </Badge>
            )}
          </div>

          {report.issues.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-red-600 mb-2">
                {report.issues.length} {report.issues.length === 1 ? 'Issue' : 'Issues'} Found:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {report.issues.slice(0, 3).map((issue, idx) => (
                  <li key={idx}>
                    • {getDocumentTypeLabel(issue.documentType)}: {issue.errors[0] ?? 'Unknown error'}
                  </li>
                ))}
                {report.issues.length > 3 && (
                  <li className="text-xs text-muted-foreground italic">
                    ...and {report.issues.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Report Table */}
      {report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Suggested Fixes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.issues.map((issue, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {getDocumentTypeLabel(issue.documentType)}
                    </TableCell>
                    <TableCell>
                      <ComplianceStatusBadge
                        status={issue.errors[0]?.includes('Missing') ? 'missing' : 'non-compliant'}
                      />
                    </TableCell>
                    <TableCell>
                      <ul className="text-sm space-y-1">
                        {issue.errors.map((error, errorIdx) => (
                          <li key={errorIdx} className="text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      <ul className="text-sm space-y-1">
                        {issue.suggestedFixes.map((fix, fixIdx) => (
                          <li key={fixIdx} className="text-muted-foreground">
                            {fix}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {report.compliant && report.issues.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  All documents meet the requirements!
                </p>
                <p className="text-sm text-green-700">
                  Your application is ready to be marked for review and submission.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
