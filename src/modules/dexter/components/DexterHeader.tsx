/**
 * Dexter Header Component
 *
 * Displays Dexter persona with organized, detail-oriented personality.
 * Shows greeting and document/compliance status message.
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 2, AC5)
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, FileText } from 'lucide-react'

interface DexterHeaderProps {
  firstName: string
  totalDocuments: number
  criticalWarnings: number
  compliancePercentage: number
}

export function DexterHeader({
  firstName,
  totalDocuments,
  criticalWarnings,
  compliancePercentage,
}: DexterHeaderProps) {
  // Determine Dexter's message based on status
  let message: string
  let messageColor: string
  let icon: React.ReactNode

  if (criticalWarnings === 0 && compliancePercentage === 100) {
    message = "Excellent! All your documents are organized and compliant. ✓"
    messageColor = "text-green-700"
    icon = <CheckCircle2 className="h-5 w-5 text-green-600" />
  } else if (criticalWarnings === 0 && compliancePercentage >= 80) {
    message = `Almost there! Just a few items to address.`
    messageColor = "text-blue-700"
    icon = <FileText className="h-5 w-5 text-blue-600" />
  } else if (criticalWarnings === 1) {
    message = "Let's fix this 1 critical issue before submission."
    messageColor = "text-orange-700"
    icon = <AlertTriangle className="h-5 w-5 text-orange-600" />
  } else if (criticalWarnings > 1) {
    message = `Let's fix these ${criticalWarnings} critical issues before submission.`
    messageColor = "text-red-700"
    icon = <AlertTriangle className="h-5 w-5 text-red-600" />
  } else {
    message = "Everything is organized and ready!"
    messageColor = "text-gray-700"
    icon = <FileText className="h-5 w-5 text-gray-600" />
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 border-blue-200">
      <div className="flex items-start gap-4">
        {/* Dexter Avatar */}
        <Avatar className="h-16 w-16 border-2 border-blue-300">
          <AvatarImage src="/agents/dexter.svg" alt="Dexter - Your Document Manager" />
          <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
            D
          </AvatarFallback>
        </Avatar>

        {/* Greeting and Status */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Hi {firstName}! I'm Dexter, your document manager.
            </h1>
            {criticalWarnings > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                ⚠️ {criticalWarnings} {criticalWarnings === 1 ? 'issue' : 'issues'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {icon}
            <p className={`text-lg font-medium ${messageColor}`}>{message}</p>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            Managing {totalDocuments} {totalDocuments === 1 ? 'document' : 'documents'} •{' '}
            {compliancePercentage}% compliant
          </p>
        </div>
      </div>
    </Card>
  )
}
