/**
 * Proactive Warnings Component
 *
 * Displays alert list with priority indicators for missing documents,
 * compliance violations, and overdue recommendations
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 3, AC2)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Warning {
  id: string
  type: 'MISSING_DOCUMENT' | 'COMPLIANCE_VIOLATION' | 'OVERDUE_RECOMMENDATION'
  severity: 'critical' | 'warning' | 'info'
  message: string
  applicationId?: string
  scholarshipName?: string
  documentId?: string
  recommendationId?: string
  actionLink?: string
}

interface ProactiveWarningsProps {
  warnings: Warning[]
  counts: {
    critical: number
    warning: number
    info: number
    total: number
  }
}

export function ProactiveWarnings({ warnings, counts }: ProactiveWarningsProps) {
  const getSeverityIcon = (severity: Warning['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: Warning['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-orange-200 bg-orange-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getSeverityBadge = (severity: Warning['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'warning':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
            Warning
          </Badge>
        )
      case 'info':
        return <Badge variant="outline">Info</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Proactive Warnings
          </CardTitle>
          {counts.total > 0 && (
            <Badge variant="outline" className="text-sm">
              {counts.total} {counts.total === 1 ? 'issue' : 'issues'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {warnings.length === 0 ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="flex items-center gap-2 text-green-800">
              <span className="text-xl">✓</span>
              <span className="font-medium">All clear! No issues detected.</span>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {warnings.map((warning) => (
              <Alert key={warning.id} className={getSeverityColor(warning.severity)}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(warning.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(warning.severity)}
                      {warning.scholarshipName && (
                        <span className="text-xs text-gray-600 truncate">
                          {warning.scholarshipName}
                        </span>
                      )}
                    </div>
                    <AlertDescription className="text-sm text-gray-800 mb-2">
                      {warning.message}
                    </AlertDescription>
                    {warning.actionLink && (
                      <Link href={warning.actionLink}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-white hover:bg-gray-50"
                        >
                          Resolve
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
