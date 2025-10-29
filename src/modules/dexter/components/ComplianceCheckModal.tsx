/**
 * Compliance Check Modal Component
 *
 * Displays results of comprehensive compliance check with issues found
 * Offers auto-fix suggestions where possible
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 11, AC4)
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'

interface ComplianceIssue {
  documentId: string
  documentName: string
  scholarshipName: string | null
  issues: Array<{
    code: string
    message: string
    autoFixAvailable: boolean
  }>
}

interface ComplianceCheckResult {
  timestamp: Date
  summary: {
    totalChecked: number
    passed: number
    failed: number
  }
  issues: ComplianceIssue[]
  message: string
}

interface ComplianceCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: ComplianceCheckResult | null
}

export function ComplianceCheckModal({ open, onOpenChange, result }: ComplianceCheckModalProps) {
  if (!result) return null

  const { summary, issues, message } = result

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Compliance Check Results
          </DialogTitle>
          <DialogDescription>
            Checked {summary.totalChecked} {summary.totalChecked === 1 ? 'document' : 'documents'}{' '}
            at {new Date(result.timestamp).toLocaleTimeString()}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="space-y-4">
          <Alert
            className={
              summary.failed === 0
                ? 'border-green-200 bg-green-50'
                : 'border-orange-200 bg-orange-50'
            }
          >
            <AlertDescription
              className={`font-medium ${
                summary.failed === 0 ? 'text-green-800' : 'text-orange-800'
              }`}
            >
              {message}
            </AlertDescription>
          </Alert>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-900">{summary.totalChecked}</p>
              <p className="text-xs text-gray-600">Checked</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{summary.passed}</p>
              <p className="text-xs text-green-700">Passed</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{summary.failed}</p>
              <p className="text-xs text-red-700">Failed</p>
            </div>
          </div>

          {/* Issues List */}
          {issues.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Issues Found ({issues.length})
              </h4>
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.documentId} className="p-4 bg-gray-50 rounded-lg border">
                    {/* Document Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {issue.documentName}
                        </p>
                        {issue.scholarshipName && (
                          <p className="text-xs text-gray-600 truncate">
                            For: {issue.scholarshipName}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive" className="flex-shrink-0">
                        {issue.issues.length} {issue.issues.length === 1 ? 'issue' : 'issues'}
                      </Badge>
                    </div>

                    {/* Issue Details */}
                    <div className="space-y-2">
                      {issue.issues.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{detail.message}</p>
                            {detail.autoFixAvailable && (
                              <div className="flex items-center gap-1 mt-1">
                                <Info className="h-3 w-3 text-blue-600" />
                                <p className="text-xs text-blue-600">Auto-fix available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Link href={`/dashboard/documents/${issue.documentId}`}>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Fix Issues
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Issues */}
          {issues.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All documents passed compliance validation. You're ready to submit!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
