/**
 * ComplianceTooltip Component
 * Story 4.3: Document Compliance Validation
 *
 * Displays detailed compliance information on hover:
 * - Format: ✓ PDF | Size: ✓ 2.3MB | Naming: ✗ Doesn't match pattern
 *
 * @component
 */

'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CheckCircle2, XCircle } from 'lucide-react'
import { ValidationErrorCode } from '@/lib/document/validation'

interface ValidationError {
  code: string
  message: string
  field?: string
  details?: Record<string, unknown>
}

interface ComplianceTooltipProps {
  children: React.ReactNode
  document: {
    fileName: string
    fileSize: number
    mimeType: string
    compliant: boolean
    validationErrors: unknown
  }
}

export function ComplianceTooltip({
  children,
  document,
}: ComplianceTooltipProps) {
  const errors = (document.validationErrors as ValidationError[]) || []
  const fileSizeMB = (document.fileSize / (1024 * 1024)).toFixed(1)

  // Determine which checks passed/failed
  const formatError = errors.find((e) => e.code === ValidationErrorCode.WRONG_FORMAT)
  const sizeError = errors.find((e) => e.code === ValidationErrorCode.FILE_TOO_LARGE)
  const namingError = errors.find((e) => e.code === ValidationErrorCode.NAMING_PATTERN_MISMATCH)

  const formatLabel = document.mimeType === 'application/pdf'
    ? 'PDF'
    : document.mimeType.includes('word')
    ? 'DOCX'
    : document.mimeType.split('/')[1]?.toUpperCase() || 'Unknown'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-sm">
            <p className="font-semibold mb-2">Compliance Details</p>

            {/* Format Check */}
            <div className="flex items-center gap-2">
              {formatError ? (
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
              )}
              <span>
                <span className="font-medium">Format:</span> {formatLabel}
              </span>
            </div>

            {/* Size Check */}
            <div className="flex items-center gap-2">
              {sizeError ? (
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
              )}
              <span>
                <span className="font-medium">Size:</span> {fileSizeMB}MB
              </span>
            </div>

            {/* Naming Check (if there was a pattern requirement) */}
            {namingError && (
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span>
                  <span className="font-medium">Naming:</span> Doesn't match pattern
                </span>
              </div>
            )}

            {/* Error messages */}
            {errors.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="font-medium text-xs text-red-600 mb-1">Issues:</p>
                {errors.map((error, idx) => (
                  <p key={idx} className="text-xs text-red-600">
                    • {error.message}
                  </p>
                ))}
              </div>
            )}

            {/* Success message */}
            {document.compliant && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-green-600 font-medium">
                  ✓ All requirements met
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
