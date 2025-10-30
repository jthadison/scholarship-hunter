/**
 * Profile Factory
 *
 * Creates test profile data with automatic generation and override support.
 * Follows factory pattern from knowledge/data-factories.md
 *
 * Usage:
 *   const profileData = createProfileData({ gpa: 3.8, satScore: 1500 })
 *
 * Features:
 *   - Faker-based realistic data generation
 *   - Override any field with custom values
 *   - Generates complete valid profile objects
 *   - Prevents data collisions in parallel tests
 */

import { faker } from '@faker-js/faker'

export interface ProfileData {
  // Academic fields
  gpa?: number | null
  gpaScale?: number
  satScore?: number | null
  actScore?: number | null
  classRank?: number | null
  classSize?: number | null
  graduationYear?: number | null
  currentGrade?: string | null

  // Demographic fields
  gender?: string | null
  ethnicity?: string[] | null
  state?: string | null
  city?: string | null
  zipCode?: string | null
  citizenship?: string | null

  // Financial fields
  financialNeed?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | null
  pellGrantEligible?: boolean
  efcRange?: string | null

  // Metadata
  completionPercentage?: number
  strengthScore?: number
}

/**
 * Generate realistic profile data with sensible defaults
 *
 * @param overrides - Custom values to override defaults
 * @returns Complete profile data object
 */
export const createProfileData = (overrides: Partial<ProfileData> = {}): ProfileData => {
  const currentYear = new Date().getFullYear()

  return {
    // Academic defaults
    gpa: faker.number.float({ min: 2.5, max: 4.0, fractionDigits: 2 }),
    gpaScale: 4.0,
    satScore: faker.number.int({ min: 800, max: 1600 }),
    actScore: faker.number.int({ min: 15, max: 36 }),
    classRank: faker.number.int({ min: 1, max: 500 }),
    classSize: faker.number.int({ min: 100, max: 600 }),
    graduationYear: currentYear + faker.number.int({ min: 0, max: 4 }),
    currentGrade: faker.helpers.arrayElement(['9th', '10th', '11th', '12th', 'College Freshman']),

    // Demographic defaults
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
    ethnicity: [
      faker.helpers.arrayElement([
        'Asian',
        'Black/African American',
        'Hispanic/Latino',
        'Native American',
        'Pacific Islander',
        'White/Caucasian',
      ]),
    ],
    state: faker.location.state({ abbreviated: true }),
    city: faker.location.city(),
    zipCode: faker.location.zipCode(),
    citizenship: faker.helpers.arrayElement([
      'US Citizen',
      'Permanent Resident',
      'International Student',
      'DACA',
    ]),

    // Financial defaults
    financialNeed: faker.helpers.arrayElement(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']),
    pellGrantEligible: faker.datatype.boolean(),
    efcRange: faker.helpers.arrayElement([
      '$0-$5,000',
      '$5,001-$10,000',
      '$10,001-$20,000',
      '$20,000+',
    ]),

    // Metadata defaults
    completionPercentage: faker.number.float({ min: 60, max: 100, fractionDigits: 2 }),
    strengthScore: faker.number.float({ min: 50, max: 95, fractionDigits: 2 }),

    // Apply overrides
    ...overrides,
  }
}

/**
 * Create profile data with minimal fields (low completion percentage)
 */
export const createMinimalProfileData = (): ProfileData => {
  return createProfileData({
    gpa: faker.number.float({ min: 2.5, max: 4.0, fractionDigits: 2 }),
    graduationYear: new Date().getFullYear() + 1,
    satScore: null,
    actScore: null,
    classRank: null,
    classSize: null,
    gender: null,
    ethnicity: null,
    city: null,
    zipCode: null,
    citizenship: null,
    pellGrantEligible: false,
    efcRange: null,
    completionPercentage: faker.number.float({ min: 20, max: 40, fractionDigits: 2 }),
  })
}

/**
 * Create profile data with complete academic information
 */
export const createAcademicProfileData = (): ProfileData => {
  const classSize = faker.number.int({ min: 200, max: 600 })
  return createProfileData({
    gpa: faker.number.float({ min: 3.5, max: 4.0, fractionDigits: 2 }),
    gpaScale: 4.0,
    satScore: faker.number.int({ min: 1200, max: 1600 }),
    actScore: faker.number.int({ min: 28, max: 36 }),
    classRank: faker.number.int({ min: 1, max: Math.floor(classSize * 0.1) }), // Top 10%
    classSize,
    graduationYear: new Date().getFullYear() + 1,
    currentGrade: '12th',
  })
}

/**
 * Create profile data with complete demographic information
 */
export const createDemographicProfileData = (): ProfileData => {
  return createProfileData({
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Non-binary']),
    ethnicity: faker.helpers.arrayElements(
      ['Asian', 'Black/African American', 'Hispanic/Latino', 'Native American', 'White/Caucasian'],
      { min: 1, max: 2 }
    ),
    state: faker.location.state({ abbreviated: true }),
    city: faker.location.city(),
    zipCode: faker.location.zipCode('#####'), // 5-digit format
    citizenship: 'US Citizen',
  })
}

/**
 * Create profile data with high financial need
 */
export const createHighNeedProfileData = (): ProfileData => {
  return createProfileData({
    financialNeed: faker.helpers.arrayElement(['HIGH', 'VERY_HIGH']),
    pellGrantEligible: true,
    efcRange: '$0-$5,000',
  })
}

/**
 * Create profile data with low financial need
 */
export const createLowNeedProfileData = (): ProfileData => {
  return createProfileData({
    financialNeed: 'LOW',
    pellGrantEligible: false,
    efcRange: '$20,000+',
  })
}

/**
 * Create complete profile data with all fields populated
 */
export const createCompleteProfileData = (): ProfileData => {
  const academicData = createAcademicProfileData()
  const demographicData = createDemographicProfileData()

  return {
    ...academicData,
    ...demographicData,
    financialNeed: faker.helpers.arrayElement(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']),
    pellGrantEligible: faker.datatype.boolean(),
    efcRange: faker.helpers.arrayElement([
      '$0-$5,000',
      '$5,001-$10,000',
      '$10,001-$20,000',
      '$20,000+',
    ]),
    completionPercentage: faker.number.float({ min: 90, max: 100, fractionDigits: 2 }),
    strengthScore: faker.number.float({ min: 75, max: 95, fractionDigits: 2 }),
  }
}

/**
 * Create profile data with validation errors (for testing error handling)
 */
export const createInvalidProfileData = (): ProfileData => {
  return {
    gpa: 5.5, // Invalid: exceeds max
    satScore: 2000, // Invalid: exceeds max
    actScore: 50, // Invalid: exceeds max
    classRank: 400,
    classSize: 300, // Invalid: rank > size
    zipCode: '123', // Invalid: wrong format
  }
}
