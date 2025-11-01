/**
 * Story 5.10: Help System - Context Detection
 *
 * Maps current route to relevant help article slugs for context-sensitive help.
 *
 * @module server/lib/help/help-context
 */

/**
 * Route to help articles mapping
 * Key: Route pattern
 * Value: Array of help article slugs (ordered by relevance)
 */
const ROUTE_TO_ARTICLES_MAP: Record<string, string[]> = {
  // Dashboard
  '/dashboard': ['dashboard-overview', 'profile-strength', 'next-steps', 'getting-started'],

  // Scholarships
  '/scholarships': [
    'search-tips',
    'match-scores',
    'eligibility-criteria',
    'scholarship-categories',
  ],
  '/scholarships/[id]': [
    'scholarship-details',
    'eligibility-criteria',
    'add-to-applications',
    'understanding-deadlines',
  ],

  // Applications
  '/applications': [
    'application-pipeline',
    'deadline-management',
    'progress-tracking',
    'application-status',
  ],
  '/applications/[id]': [
    'application-workspace',
    'managing-requirements',
    'essay-prompts',
    'document-uploads',
  ],

  // Essays
  '/essays': ['essay-library', 'essay-adaptability', 'writing-tips', 'ai-assistance'],
  '/essays/[id]': [
    'essay-editor',
    'essay-writing-tips',
    'ai-assistance',
    'quality-assessment',
    'essay-phases',
  ],

  // Documents
  '/documents': ['document-vault', 'document-types', 'uploading-files', 'version-control'],
  '/documents/[id]': ['document-details', 'version-control', 'compliance-requirements'],

  // Recommendations
  '/recommendations': [
    'recommendation-letters',
    'requesting-recommendations',
    'tracking-recommendations',
  ],

  // Analytics
  '/analytics': [
    'success-metrics',
    'funding-summary',
    'gap-analysis',
    'competitive-positioning',
  ],

  // Profile
  '/profile': ['profile-completion', 'profile-strength', 'profile-editing', 'data-accuracy'],
  '/profile/edit': ['profile-editing', 'required-fields', 'profile-strength', 'data-accuracy'],

  // Counselor Portal
  '/counselor': [
    'counselor-dashboard',
    'student-monitoring',
    'counselor-recommendations',
    'at-risk-students',
  ],

  // Parent Portal
  '/parent': [
    'parent-dashboard',
    'progress-monitoring',
    'parent-notifications',
    'supporting-student',
  ],
}

/**
 * Get contextual help article slugs for a given route
 *
 * @param route - Current page route (e.g., '/dashboard', '/scholarships')
 * @returns Array of help article slugs (up to 5) relevant to the route
 */
export function getContextualHelpArticles(route: string): string[] {
  // Normalize route (remove trailing slash, query params)
  const normalizedRoute = route.split('?')[0]?.replace(/\/$/, '') || '/'

  // Exact match
  if (ROUTE_TO_ARTICLES_MAP[normalizedRoute]) {
    return ROUTE_TO_ARTICLES_MAP[normalizedRoute]!.slice(0, 5)
  }

  // Pattern match (e.g., /scholarships/123 → /scholarships/[id])
  for (const [pattern, articles] of Object.entries(ROUTE_TO_ARTICLES_MAP)) {
    // Convert pattern to regex (replace [id] with any characters)
    const regex = new RegExp(`^${pattern.replace(/\[id\]/g, '[^/]+')}$`)

    if (regex.test(normalizedRoute)) {
      return articles.slice(0, 5)
    }
  }

  // Fallback to general help
  return ['getting-started', 'general-help', 'contact-support']
}

/**
 * Get all available route mappings (for admin/debugging)
 */
export function getAllRouteMappings(): typeof ROUTE_TO_ARTICLES_MAP {
  return ROUTE_TO_ARTICLES_MAP
}
