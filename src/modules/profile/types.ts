// ============================================================================
// Story 1.5: Profile Experience & Special Circumstances Type Definitions
// ============================================================================

/**
 * Extracurricular Activity
 * Stored in Profile.extracurriculars JSON array
 */
export interface ExtracurricularActivity {
  name: string
  category: 'Sports' | 'Academic Clubs' | 'Arts/Music' | 'Community Service' | 'Other'
  hoursPerWeek: number
  yearsInvolved: number
  description?: string
  isLeadership?: boolean
  leadershipTitle?: string
}

/**
 * Work Experience
 * Stored in Profile.workExperience JSON array
 */
export interface WorkExperience {
  jobTitle: string
  employer: string
  startDate: string // ISO date string
  endDate?: string // ISO date string, undefined if currently employed
  hoursPerWeek: number
  description?: string
}

/**
 * Leadership Role
 * Stored in Profile.leadershipRoles JSON array
 */
export interface LeadershipRole {
  title: string
  organization: string
  startDate: string // ISO date string
  endDate?: string // ISO date string, undefined if current position
  description?: string
}

/**
 * Award or Honor
 * Stored in Profile.awardsHonors JSON array
 */
export interface AwardHonor {
  name: string
  issuer: string
  date: string // ISO date string
  level: 'School' | 'Local' | 'State' | 'National' | 'International'
  description?: string
}

// ============================================================================
// Enums & Constants
// ============================================================================

export const EXTRACURRICULAR_CATEGORIES = [
  'Sports',
  'Academic Clubs',
  'Arts/Music',
  'Community Service',
  'Other'
] as const

export const AWARD_LEVELS = [
  'School',
  'Local',
  'State',
  'National',
  'International'
] as const

export const MILITARY_AFFILIATIONS = [
  'None',
  'Active Duty',
  'Veteran',
  'Reserves/National Guard',
  'Military Dependent',
  'Gold Star Family'
] as const

export const DISABILITY_CATEGORIES = [
  'Physical',
  'Visual',
  'Hearing',
  'Learning',
  'Cognitive',
  'Mental Health',
  'Chronic Illness',
  'Other'
] as const

// ============================================================================
// Field of Study Mapping
// ============================================================================

export type FieldOfStudy =
  | 'STEM'
  | 'Business'
  | 'Humanities'
  | 'Social Sciences'
  | 'Health Sciences'
  | 'Arts'
  | 'Communications'
  | 'Education'
  | 'Agriculture'
  | 'Law'
  | 'Other'

// ============================================================================
// Helper Types for Forms
// ============================================================================

export type ExtracurricularFormData = Omit<ExtracurricularActivity, 'isLeadership' | 'leadershipTitle'> & {
  isLeadership: boolean
  leadershipTitle: string
}

export type WorkExperienceFormData = Omit<WorkExperience, 'endDate'> & {
  currentlyEmployed: boolean
  endDate: string
}

// ============================================================================
// Story 1.6: Validation & Completeness Types
// ============================================================================

/**
 * Missing field metadata for prompts and UI
 */
export interface MissingField {
  field: string
  label: string
  isRequired: boolean
  category: string
  prompt: string
  estimatedImpact: string
}

/**
 * Validation error with severity level
 */
export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Profile validation result
 */
export interface ProfileValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Profile readiness check result
 */
export interface ProfileReadinessResult {
  isReady: boolean
  completeness: number
  missingRequired: string[]
}
