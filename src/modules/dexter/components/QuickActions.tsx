/**
 * Quick Actions Component
 *
 * Provides prominent action buttons for common document management tasks
 * Includes upload, request recommendation, run compliance check, and download all
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 6, AC4)
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Mail, CheckSquare, Download } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface QuickActionsProps {
  onRunComplianceCheck?: () => void
}

export function QuickActions({ onRunComplianceCheck }: QuickActionsProps) {
  const [isRunningCheck, setIsRunningCheck] = useState(false)

  const handleRunComplianceCheck = async () => {
    setIsRunningCheck(true)
    try {
      onRunComplianceCheck?.()
    } finally {
      setIsRunningCheck(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Upload Document */}
          <Link href="/dashboard/documents/upload" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-blue-600" />
              <div className="text-center">
                <p className="font-semibold text-sm">Upload Document</p>
                <p className="text-xs text-gray-500">Add to vault</p>
              </div>
            </Button>
          </Link>

          {/* Request Recommendation */}
          <Link href="/dashboard/applications" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <Mail className="h-6 w-6 text-purple-600" />
              <div className="text-center">
                <p className="font-semibold text-sm">Request Recommendation</p>
                <p className="text-xs text-gray-500">Send email</p>
              </div>
            </Button>
          </Link>

          {/* Run Compliance Check */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
            onClick={handleRunComplianceCheck}
            disabled={isRunningCheck}
          >
            <CheckSquare className="h-6 w-6 text-green-600" />
            <div className="text-center">
              <p className="font-semibold text-sm">
                {isRunningCheck ? 'Checking...' : 'Run Compliance Check'}
              </p>
              <p className="text-xs text-gray-500">Validate all docs</p>
            </div>
          </Button>

          {/* Download All Documents */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
            disabled
            title="Coming soon"
          >
            <Download className="h-6 w-6 text-gray-400" />
            <div className="text-center">
              <p className="font-semibold text-sm text-gray-400">Download All</p>
              <p className="text-xs text-gray-400">Backup to ZIP</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
