/**
 * Progress Calculation Service
 *
 * Calculates application completion percentage based on weighted formula:
 * - Essays: 50%
 * - Documents: 30%
 * - Recommendations: 20%
 *
 * @module server/services/progress/calculate
 */

interface ProgressInput {
  essayCount: number
  essayComplete: number
  documentsRequired: number
  documentsUploaded: number
  recsRequired: number
  recsReceived: number
}

/**
 * Calculate application progress percentage using weighted formula
 *
 * Formula:
 * - Essays: 50% weight
 * - Documents: 30% weight
 * - Recommendations: 20% weight
 *
 * Edge cases:
 * - If no essays required, essay component is considered 100% complete
 * - If no documents required, document component is considered 100% complete
 * - If no recommendations required, rec component is considered 100% complete
 *
 * @param application - Application with progress tracking fields
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercentage(application: ProgressInput): number {
  const essayWeight = 0.5
  const documentWeight = 0.3
  const recommendationWeight = 0.2

  // Calculate essay progress
  const essayProgress =
    application.essayCount > 0
      ? (application.essayComplete / application.essayCount) * essayWeight
      : essayWeight // If no essays required, consider complete

  // Calculate document progress
  const docProgress =
    application.documentsRequired > 0
      ? (application.documentsUploaded / application.documentsRequired) * documentWeight
      : documentWeight // If no documents required, consider complete

  // Calculate recommendation progress
  const recProgress =
    application.recsRequired > 0
      ? (application.recsReceived / application.recsRequired) * recommendationWeight
      : recommendationWeight // If no recommendations required, consider complete

  // Return rounded percentage (0-100)
  return Math.round((essayProgress + docProgress + recProgress) * 100)
}

/**
 * Get progress breakdown by component
 *
 * @param application - Application with progress tracking fields
 * @returns Object with individual component percentages
 */
export function getProgressBreakdown(application: ProgressInput) {
  const essayProgress =
    application.essayCount > 0
      ? Math.round((application.essayComplete / application.essayCount) * 100)
      : 100

  const docProgress =
    application.documentsRequired > 0
      ? Math.round((application.documentsUploaded / application.documentsRequired) * 100)
      : 100

  const recProgress =
    application.recsRequired > 0
      ? Math.round((application.recsReceived / application.recsRequired) * 100)
      : 100

  return {
    essay: {
      percentage: essayProgress,
      complete: application.essayComplete,
      total: application.essayCount,
    },
    documents: {
      percentage: docProgress,
      complete: application.documentsUploaded,
      total: application.documentsRequired,
    },
    recommendations: {
      percentage: recProgress,
      complete: application.recsReceived,
      total: application.recsRequired,
    },
    overall: calculateProgressPercentage(application),
  }
}
