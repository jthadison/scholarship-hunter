/**
 * ComplianceStatusBadge Component
 * Story 4.3: Document Compliance Validation
 *
 * Displays compliance status with color-coded icons:
 * - Green checkmark (✓) = Fully compliant
 * - Red X (✗) = Non-compliant with errors
 * - Yellow warning (⚠️) = Missing required document
 *
 * @component
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'missing'

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus
  className?: string
  showIcon?: boolean
  showText?: boolean
}

export function ComplianceStatusBadge({
  status,
  className,
  showIcon = true,
  showText = true,
}: ComplianceStatusBadgeProps) {
  const config = {
    compliant: {
      icon: CheckCircle2,
      label: 'Compliant',
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    'non-compliant': {
      icon: XCircle,
      label: 'Non-compliant',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
    missing: {
      icon: AlertTriangle,
      label: 'Missing',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    },
  }

  const { icon: Icon, label, className: statusClassName } = config[status]

  return (
    <Badge
      variant="outline"
      className={cn(statusClassName, 'gap-1', className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {showText && <span>{label}</span>}
    </Badge>
  )
}

/**
 * Determines compliance status from document data
 */
export function getComplianceStatus(document: {
  compliant: boolean
  validationErrors: unknown
}): ComplianceStatus {
  if (document.compliant) {
    return 'compliant'
  }
  return 'non-compliant'
}
