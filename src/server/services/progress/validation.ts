/**
 * Progress Validation Service
 *
 * Validates application completion and enforces completion gate for status transitions.
 *
 * @module server/services/progress/validation
 */

interface ValidationInput {
  essayCount: number
  essayComplete: number
  documentsRequired: number
  documentsUploaded: number
  recsRequired: number
  recsReceived: number
}

interface ValidationResult {
  canMark: boolean
  missingItems: string[]
}

/**
 * Check if application can be marked as READY_FOR_REVIEW
 *
 * Requirements:
 * - All essays must be complete (essayComplete === essayCount)
 * - All documents must be uploaded (documentsUploaded === documentsRequired)
 * - All recommendations must be received (recsReceived === recsRequired)
 *
 * @param application - Application to validate
 * @returns Validation result with list of missing items
 */
export function canMarkReadyForReview(application: ValidationInput): ValidationResult {
  const missingItems: string[] = []

  // Check essays
  if (application.essayComplete < application.essayCount) {
    const remaining = application.essayCount - application.essayComplete
    missingItems.push(`${remaining} essay${remaining > 1 ? 's' : ''} incomplete`)
  }

  // Check documents
  if (application.documentsUploaded < application.documentsRequired) {
    const remaining = application.documentsRequired - application.documentsUploaded
    missingItems.push(`${remaining} document${remaining > 1 ? 's' : ''} missing`)
  }

  // Check recommendations
  if (application.recsReceived < application.recsRequired) {
    const remaining = application.recsRequired - application.recsReceived
    missingItems.push(`${remaining} recommendation${remaining > 1 ? 's' : ''} pending`)
  }

  return {
    canMark: missingItems.length === 0,
    missingItems,
  }
}

/**
 * Get detailed blocking requirements for UI display
 *
 * @param application - Application to validate
 * @returns Array of human-readable blocking requirement messages
 */
export function getBlockingRequirements(application: ValidationInput): string[] {
  const { missingItems } = canMarkReadyForReview(application)
  return missingItems
}

/**
 * Validate if application is complete (all requirements met)
 *
 * @param application - Application to validate
 * @returns true if all requirements are complete
 */
export function isApplicationComplete(application: ValidationInput): boolean {
  return (
    application.essayComplete === application.essayCount &&
    application.documentsUploaded === application.documentsRequired &&
    application.recsReceived === application.recsRequired
  )
}
