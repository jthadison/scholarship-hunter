/**
 * Profile Data Factory
 * Generates realistic test data for profile testing using faker
 *
 * Usage:
 *   const profile = createTestProfile({ gpa: 3.9 }) // Override specific fields
 *   const student = createTestStudent() // Create student with profile
 */

import { faker } from '@faker-js/faker'
import { FinancialNeed } from '@prisma/client'
import type { Profile } from '@prisma/client'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

const CITIZENSHIP_OPTIONS = [
  'US Citizen',
  'Permanent Resident',
  'DACA Recipient',
  'International Student',
  'Refugee/Asylee',
] as const

const ETHNICITY_OPTIONS = [
  'African American/Black',
  'Asian',
  'Hispanic/Latino',
  'Native American/Alaska Native',
  'Native Hawaiian/Pacific Islander',
  'White/Caucasian',
  'Two or More Races',
  'Other',
] as const

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const

const CURRENT_GRADE_OPTIONS = [
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College Freshman',
  'College Sophomore',
  'College Junior',
  'College Senior',
  'Graduate Student',
] as const

const FIELD_OF_STUDY_OPTIONS = [
  'STEM',
  'Business',
  'Arts & Humanities',
  'Social Sciences',
  'Education',
  'Health Sciences',
  'Law',
  'Other',
] as const

const EFC_RANGE_OPTIONS = [
  '$0-$5,000',
  '$5,001-$10,000',
  '$10,001-$20,000',
  '$20,001+',
] as const

export interface CreateProfileOptions {
  // Academic
  gpa?: number | null
  gpaScale?: number | null
  satScore?: number | null
  actScore?: number | null
  classRank?: number | null
  classSize?: number | null
  graduationYear?: number | null
  currentGrade?: (typeof CURRENT_GRADE_OPTIONS)[number] | null

  // Demographics
  gender?: string | null
  ethnicity?: string[] | null
  state?: (typeof US_STATES)[number] | null
  city?: string | null
  zipCode?: string | null
  citizenship?: (typeof CITIZENSHIP_OPTIONS)[number] | null

  // Financial
  financialNeed?: FinancialNeed | null
  pellGrantEligible?: boolean | null
  efcRange?: (typeof EFC_RANGE_OPTIONS)[number] | null

  // Major & Career
  intendedMajor?: string | null
  fieldOfStudy?: (typeof FIELD_OF_STUDY_OPTIONS)[number] | null
  careerGoals?: string | null

  // Experience
  extracurriculars?: any[] | null
  volunteerHours?: number | null
  workExperience?: any[] | null
  leadershipRoles?: any[] | null
  awardsHonors?: any[] | null

  // Special Circumstances
  firstGeneration?: boolean | null
  militaryAffiliation?: string | null
  disabilities?: string | null
  additionalContext?: string | null

  // Metadata
  completionPercentage?: number
  strengthScore?: number
}

/**
 * Create a test profile with realistic data
 * All fields can be overridden via options parameter
 */
export function createTestProfile(overrides: CreateProfileOptions = {}): Partial<Profile> {
  const currentYear = new Date().getFullYear()
  const graduationYear = overrides.graduationYear ?? currentYear + faker.number.int({ min: 1, max: 4 })

  return {
    id: faker.string.uuid(),
    studentId: faker.string.uuid(),

    // Academic Information
    gpa: overrides.gpa !== undefined ? overrides.gpa : faker.number.float({ min: 2.0, max: 4.0, fractionDigits: 2 }),
    gpaScale: overrides.gpaScale !== undefined ? overrides.gpaScale : 4.0,
    satScore: overrides.satScore !== undefined
      ? overrides.satScore
      : faker.datatype.boolean() ? faker.number.int({ min: 400, max: 1600, multipleOf: 10 }) : null,
    actScore: overrides.actScore !== undefined
      ? overrides.actScore
      : faker.datatype.boolean() ? faker.number.int({ min: 1, max: 36 }) : null,
    classRank: overrides.classRank !== undefined
      ? overrides.classRank
      : faker.datatype.boolean() ? faker.number.int({ min: 1, max: 500 }) : null,
    classSize: overrides.classSize !== undefined
      ? overrides.classSize
      : faker.datatype.boolean() ? faker.number.int({ min: 50, max: 800 }) : null,
    graduationYear,
    currentGrade: overrides.currentGrade !== undefined
      ? overrides.currentGrade
      : faker.helpers.arrayElement(CURRENT_GRADE_OPTIONS),

    // Demographics
    gender: overrides.gender !== undefined
      ? overrides.gender
      : faker.helpers.arrayElement(GENDER_OPTIONS),
    ethnicity: overrides.ethnicity !== undefined
      ? overrides.ethnicity
      : faker.helpers.arrayElements(ETHNICITY_OPTIONS, { min: 1, max: 2 }),
    state: overrides.state !== undefined
      ? overrides.state
      : faker.helpers.arrayElement(US_STATES),
    city: overrides.city !== undefined ? overrides.city : faker.location.city(),
    zipCode: overrides.zipCode !== undefined
      ? overrides.zipCode
      : faker.location.zipCode('#####'),
    citizenship: overrides.citizenship !== undefined
      ? overrides.citizenship
      : faker.helpers.arrayElement(CITIZENSHIP_OPTIONS),

    // Financial Need
    financialNeed: overrides.financialNeed !== undefined
      ? overrides.financialNeed
      : faker.helpers.arrayElement(Object.values(FinancialNeed)),
    pellGrantEligible: overrides.pellGrantEligible !== undefined
      ? overrides.pellGrantEligible
      : faker.datatype.boolean(),
    efcRange: overrides.efcRange !== undefined
      ? overrides.efcRange
      : faker.helpers.arrayElement(EFC_RANGE_OPTIONS),

    // Major & Career
    intendedMajor: overrides.intendedMajor !== undefined
      ? overrides.intendedMajor
      : faker.helpers.arrayElement([
          'Computer Science',
          'Engineering',
          'Business Administration',
          'Biology',
          'Psychology',
          'Nursing',
          'Education',
          'English',
          'Political Science',
          'Economics',
        ]),
    fieldOfStudy: overrides.fieldOfStudy !== undefined
      ? overrides.fieldOfStudy
      : faker.helpers.arrayElement(FIELD_OF_STUDY_OPTIONS),
    careerGoals: overrides.careerGoals !== undefined
      ? overrides.careerGoals
      : faker.datatype.boolean() ? faker.lorem.sentence() : null,

    // Experience
    extracurriculars: overrides.extracurriculars !== undefined
      ? overrides.extracurriculars
      : faker.datatype.boolean() ? [createTestExtracurricular()] : null,
    volunteerHours: overrides.volunteerHours !== undefined
      ? overrides.volunteerHours
      : faker.number.int({ min: 0, max: 500 }),
    workExperience: overrides.workExperience !== undefined
      ? overrides.workExperience
      : faker.datatype.boolean() ? [createTestWorkExperience()] : null,
    leadershipRoles: overrides.leadershipRoles !== undefined
      ? overrides.leadershipRoles
      : faker.datatype.boolean() ? [createTestLeadershipRole()] : null,
    awardsHonors: overrides.awardsHonors !== undefined
      ? overrides.awardsHonors
      : faker.datatype.boolean() ? [createTestAward()] : null,

    // Special Circumstances
    firstGeneration: overrides.firstGeneration !== undefined
      ? overrides.firstGeneration
      : faker.datatype.boolean(),
    militaryAffiliation: overrides.militaryAffiliation !== undefined
      ? overrides.militaryAffiliation
      : faker.datatype.boolean()
        ? faker.helpers.arrayElement(['Self', 'Parent', 'Spouse', 'None'])
        : null,
    disabilities: overrides.disabilities !== undefined
      ? overrides.disabilities
      : faker.datatype.boolean() ? 'Learning Disability' : null,
    additionalContext: overrides.additionalContext !== undefined
      ? overrides.additionalContext
      : faker.datatype.boolean() ? faker.lorem.paragraph() : null,

    // Metadata
    completionPercentage: overrides.completionPercentage !== undefined
      ? overrides.completionPercentage
      : faker.number.int({ min: 50, max: 100 }),
    strengthScore: overrides.strengthScore !== undefined
      ? overrides.strengthScore
      : faker.number.int({ min: 40, max: 95 }),

    createdAt: new Date(),
    updatedAt: new Date(),
  } as Partial<Profile>
}

/**
 * Create a test extracurricular activity
 */
export function createTestExtracurricular(overrides: any = {}) {
  return {
    name: overrides.name ?? faker.helpers.arrayElement([
      'Debate Club',
      'Student Government',
      'National Honor Society',
      'Robotics Team',
      'Yearbook Committee',
      'Drama Club',
      'Mock Trial',
    ]),
    category: overrides.category ?? faker.helpers.arrayElement([
      'Academic Clubs',
      'Sports',
      'Arts & Music',
      'Community Service',
      'Student Government',
    ]),
    hoursPerWeek: overrides.hoursPerWeek ?? faker.number.int({ min: 1, max: 10 }),
    weeksPerYear: overrides.weeksPerYear ?? faker.number.int({ min: 20, max: 52 }),
    yearsInvolved: overrides.yearsInvolved ?? faker.number.int({ min: 1, max: 4 }),
    ...overrides,
  }
}

/**
 * Create a test work experience entry
 */
export function createTestWorkExperience(overrides: any = {}) {
  const startYear = new Date().getFullYear() - faker.number.int({ min: 1, max: 3 })

  return {
    jobTitle: overrides.jobTitle ?? faker.person.jobTitle(),
    employer: overrides.employer ?? faker.company.name(),
    startDate: overrides.startDate ?? `${startYear}-06-01`,
    endDate: overrides.endDate ?? (faker.datatype.boolean() ? `${startYear + 1}-08-01` : null),
    hoursPerWeek: overrides.hoursPerWeek ?? faker.number.int({ min: 5, max: 40 }),
    description: overrides.description ?? faker.datatype.boolean() ? faker.lorem.sentence() : null,
    ...overrides,
  }
}

/**
 * Create a test leadership role
 */
export function createTestLeadershipRole(overrides: any = {}) {
  return {
    title: overrides.title ?? faker.helpers.arrayElement([
      'President',
      'Vice President',
      'Secretary',
      'Treasurer',
      'Captain',
      'Team Lead',
    ]),
    organization: overrides.organization ?? faker.helpers.arrayElement([
      'Student Council',
      'Debate Team',
      'Varsity Soccer',
      'National Honor Society',
      'Key Club',
    ]),
    startDate: overrides.startDate ?? `${new Date().getFullYear() - 1}-09-01`,
    endDate: overrides.endDate ?? null,
    description: overrides.description ?? faker.datatype.boolean() ? faker.lorem.sentence() : null,
    ...overrides,
  }
}

/**
 * Create a test award/honor
 */
export function createTestAward(overrides: any = {}) {
  return {
    name: overrides.name ?? faker.helpers.arrayElement([
      'Honor Roll',
      'National Merit Scholar',
      'AP Scholar',
      'Presidential Award',
      'Dean\'s List',
    ]),
    issuer: overrides.issuer ?? faker.helpers.arrayElement([
      'School',
      'National Merit Scholarship Corporation',
      'College Board',
      'University',
    ]),
    date: overrides.date ?? faker.date.past({ years: 2 }).toISOString().split('T')[0],
    level: overrides.level ?? faker.helpers.arrayElement(['School', 'District', 'State', 'National', 'International']),
    description: overrides.description ?? faker.datatype.boolean() ? faker.lorem.sentence() : null,
    ...overrides,
  }
}

/**
 * Create a test student with optional profile
 */
export function createTestStudent(options: { includeProfile?: boolean; profileOverrides?: CreateProfileOptions } = {}) {
  const { includeProfile = true, profileOverrides = {} } = options

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    profile: includeProfile ? createTestProfile(profileOverrides) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create minimal required profile data (for draft saves)
 */
export function createMinimalProfile(overrides: CreateProfileOptions = {}): Partial<Profile> {
  return {
    gpa: overrides.gpa ?? 3.5,
    graduationYear: overrides.graduationYear ?? new Date().getFullYear() + 1,
    currentGrade: overrides.currentGrade ?? '12th Grade',
    gender: overrides.gender ?? 'Female',
    ethnicity: overrides.ethnicity ?? ['Asian'],
    state: overrides.state ?? 'CA',
    citizenship: overrides.citizenship ?? 'US Citizen',
    intendedMajor: overrides.intendedMajor ?? 'Computer Science',
    fieldOfStudy: overrides.fieldOfStudy ?? 'STEM',
    financialNeed: overrides.financialNeed ?? FinancialNeed.MODERATE,
    ...overrides,
  }
}
