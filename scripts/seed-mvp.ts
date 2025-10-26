#!/usr/bin/env tsx
/**
 * MVP Seed Script
 *
 * Generates and imports 1,000+ diverse scholarships for MVP testing.
 * Creates realistic scholarship data across all 6 eligibility dimensions.
 *
 * Usage:
 *   npm run seed:mvp
 */

import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import * as path from 'path'
import { importScholarships } from './import-scholarships-json'

// Scholarship categories distribution
const CATEGORY_DISTRIBUTION = {
  'Merit-based': 0.3, // 30%
  'Need-based': 0.3, // 30%
  'Identity-based': 0.2, // 20%
  'Mixed': 0.2, // 20%
}

const TOTAL_SCHOLARSHIPS = 1000

// Sample data for realistic scholarships
const SCHOLARSHIP_PREFIXES = [
  'Excellence in',
  'Future Leaders',
  'Rising Stars',
  'Emerging Scholars',
  'Academic Achievement',
  'Community Impact',
  'Innovation',
  'Leadership',
  'Pioneer',
  'Pathfinder',
  'Trailblazer',
  'Achievement',
  'Opportunity',
  'Foundation',
  'Legacy',
]

const SCHOLARSHIP_SUFFIXES = [
  'Scholarship',
  'Award',
  'Grant',
  'Fellowship',
  'Fund',
  'Endowment',
  'Program',
  'Prize',
]

const FIELDS_OF_STUDY = [
  'STEM',
  'Engineering',
  'Healthcare',
  'Business',
  'Education',
  'Liberal Arts',
  'Computer Science',
  'Nursing',
  'Social Sciences',
  'Fine Arts',
]

const MAJORS = {
  STEM: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Statistics'],
  Engineering: ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Computer Engineering'],
  Healthcare: ['Nursing', 'Pre-Med', 'Public Health', 'Pharmacy', 'Physical Therapy'],
  Business: ['Business Administration', 'Finance', 'Marketing', 'Accounting', 'Economics'],
  Education: ['Elementary Education', 'Secondary Education', 'Special Education', 'Educational Leadership'],
  'Computer Science': ['Computer Science', 'Software Engineering', 'Data Science', 'Cybersecurity', 'Information Systems'],
  'Liberal Arts': ['English', 'History', 'Philosophy', 'Political Science', 'Sociology'],
  'Social Sciences': ['Psychology', 'Sociology', 'Anthropology', 'Social Work', 'Criminal Justice'],
  'Fine Arts': ['Music', 'Theater', 'Visual Arts', 'Dance', 'Creative Writing'],
}

const PROVIDER_TYPES = [
  'Foundation',
  'Society',
  'Association',
  'Organization',
  'Institute',
  'Council',
  'Alliance',
  'Coalition',
  'Consortium',
  'Network',
]

const ETHNICITIES = [
  'Hispanic or Latino',
  'African American',
  'Asian American',
  'Native American',
  'Pacific Islander',
  'Caucasian',
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

/**
 * Generate a random category based on distribution
 */
function randomCategory(): 'Merit-based' | 'Need-based' | 'Identity-based' | 'Mixed' {
  const rand = Math.random()
  let cumulative = 0

  for (const [category, probability] of Object.entries(CATEGORY_DISTRIBUTION)) {
    cumulative += probability
    if (rand <= cumulative) {
      return category as 'Merit-based' | 'Need-based' | 'Identity-based' | 'Mixed'
    }
  }

  return 'Mixed'
}

/**
 * Generate scholarship name
 */
function generateScholarshipName(category: string, field?: string): string {
  const prefix = faker.helpers.arrayElement(SCHOLARSHIP_PREFIXES)
  const suffix = faker.helpers.arrayElement(SCHOLARSHIP_SUFFIXES)

  if (field) {
    return `${prefix} ${field} ${suffix}`
  }

  const variants = [
    `${prefix} ${suffix}`,
    `${faker.company.name()} ${suffix}`,
    `${faker.location.state()} ${prefix} ${suffix}`,
  ]

  return faker.helpers.arrayElement(variants)
}

/**
 * Generate provider name
 */
function generateProviderName(): string {
  const type = faker.helpers.arrayElement(PROVIDER_TYPES)
  const variants = [
    `National ${faker.word.adjective()} ${type}`,
    `${faker.location.state()} ${type} of ${faker.word.noun()}`,
    `${faker.company.name()} ${type}`,
    `American ${faker.word.adjective()} ${type}`,
  ]

  return faker.helpers.arrayElement(variants)
}

/**
 * Generate eligibility criteria based on category
 */
function generateEligibilityCriteria(category: string) {
  const criteria: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  // Academic criteria (always include some basic requirements)
  if (category === 'Merit-based' || category === 'Mixed' || Math.random() > 0.3) {
    criteria.academic = {}

    if (category === 'Merit-based') {
      // Stricter requirements for merit-based
      criteria.academic.minGPA = faker.number.float({ min: 3.0, max: 3.8, fractionDigits: 1 })
      if (Math.random() > 0.5) {
        criteria.academic.minSAT = faker.helpers.arrayElement([1200, 1250, 1300, 1350, 1400])
      }
      if (Math.random() > 0.5) {
        criteria.academic.minACT = faker.helpers.arrayElement([26, 28, 30, 32])
      }
    } else {
      // More lenient for other categories
      criteria.academic.minGPA = faker.number.float({ min: 2.0, max: 3.5, fractionDigits: 1 })
    }
  }

  // Demographic criteria
  if (category === 'Identity-based' || category === 'Mixed' || Math.random() > 0.5) {
    criteria.demographic = {}

    // Gender requirement (30% of scholarships)
    if (Math.random() > 0.7) {
      criteria.demographic.requiredGender = faker.helpers.arrayElement(['Male', 'Female', 'Any'])
    }

    // Ethnicity requirement (20% of scholarships)
    if (Math.random() > 0.8) {
      const count = faker.number.int({ min: 1, max: 3 })
      criteria.demographic.requiredEthnicity = faker.helpers.arrayElements(ETHNICITIES, count)
    }

    // Age limits (40% of scholarships)
    if (Math.random() > 0.6) {
      criteria.demographic.ageMin = faker.helpers.arrayElement([16, 17, 18])
      criteria.demographic.ageMax = faker.helpers.arrayElement([24, 25, 30, 35])
    }

    // State requirements (25% of scholarships)
    if (Math.random() > 0.75) {
      const count = faker.number.int({ min: 1, max: 5 })
      criteria.demographic.requiredState = faker.helpers.arrayElements(US_STATES, count)
    }

    // Residency (15% of scholarships)
    if (Math.random() > 0.85) {
      criteria.demographic.residencyRequired = faker.helpers.arrayElement(['In-State', 'Out-of-State', 'Any'])
    }
  }

  // Major/Field criteria (50% of scholarships)
  if (Math.random() > 0.5) {
    criteria.majorField = {}
    const field = faker.helpers.arrayElement(FIELDS_OF_STUDY)
    criteria.majorField.requiredFieldOfStudy = [field]

    // Add specific majors (70% of time)
    if (Math.random() > 0.3 && MAJORS[field as keyof typeof MAJORS]) {
      const count = faker.number.int({ min: 1, max: 4 })
      criteria.majorField.eligibleMajors = faker.helpers.arrayElements(MAJORS[field as keyof typeof MAJORS], count)
    }
  }

  // Experience criteria (35% of scholarships)
  if (Math.random() > 0.65) {
    criteria.experience = {}

    if (Math.random() > 0.6) {
      criteria.experience.minVolunteerHours = faker.helpers.arrayElement([25, 50, 75, 100])
    }

    if (Math.random() > 0.7) {
      criteria.experience.leadershipRequired = true
    }

    if (Math.random() > 0.8) {
      criteria.experience.awardsHonorsRequired = true
    }
  }

  // Financial criteria
  if (category === 'Need-based' || category === 'Mixed') {
    criteria.financial = {
      requiresFinancialNeed: true,
    }

    if (Math.random() > 0.4) {
      criteria.financial.maxEFC = faker.helpers.arrayElement([0, 2500, 5000, 7500, 10000])
    }

    if (Math.random() > 0.6) {
      criteria.financial.pellGrantRequired = true
    }

    if (Math.random() > 0.5) {
      criteria.financial.financialNeedLevel = faker.helpers.arrayElement(['MODERATE', 'HIGH', 'VERY_HIGH'])
    }
  }

  // Special criteria (30% of scholarships)
  if (Math.random() > 0.7) {
    criteria.special = {}

    if (Math.random() > 0.7) {
      criteria.special.firstGenerationRequired = true
    }

    if (Math.random() > 0.85) {
      criteria.special.militaryAffiliation = faker.helpers.arrayElement(['Veteran', 'Dependent', 'Active Duty'])
    }

    if (Math.random() > 0.9) {
      criteria.special.disabilityRequired = true
    }

    criteria.special.citizenshipRequired = faker.helpers.arrayElement(['US Citizen', 'Permanent Resident', 'Any'])
  }

  return criteria
}

/**
 * Generate a single scholarship
 */
function generateScholarship(): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  const category = randomCategory()
  const field = Math.random() > 0.5 ? faker.helpers.arrayElement(FIELDS_OF_STUDY) : undefined
  const name = generateScholarshipName(category, field)
  const provider = generateProviderName()

  // Award amount based on category
  let awardAmount: number
  let awardAmountMax: number | undefined

  if (category === 'Merit-based') {
    awardAmount = faker.helpers.arrayElement([2500, 5000, 7500, 10000, 15000, 20000])
  } else if (category === 'Need-based') {
    awardAmount = faker.helpers.arrayElement([1000, 2000, 3000, 4000, 5000])
  } else {
    awardAmount = faker.helpers.arrayElement([1000, 2000, 3000, 5000, 7500, 10000])
  }

  // 30% have award ranges
  if (Math.random() > 0.7) {
    awardAmountMax = awardAmount + faker.helpers.arrayElement([2500, 5000, 10000])
  }

  // Deadline in next 12 months
  const deadline = faker.date.future({ years: 1 })

  // Number of awards
  const numberOfAwards = faker.helpers.arrayElement([1, 1, 1, 5, 10, 15, 20, 25, 50])

  // Renewable (40% are renewable)
  const renewable = Math.random() > 0.6
  const renewalYears = renewable ? faker.helpers.arrayElement([2, 3, 4]) : undefined

  // Generate eligibility criteria
  const eligibilityCriteria = generateEligibilityCriteria(category)

  // Essay prompts (60% have essays)
  const essayPrompts = Math.random() > 0.4
    ? [
        {
          prompt: faker.helpers.arrayElement([
            'Describe your academic and career goals.',
            'How will this scholarship help you achieve your dreams?',
            'Discuss a challenge you overcame and what you learned.',
            'What impact do you hope to make in your field?',
            'Describe your community involvement and leadership experience.',
          ]),
          wordLimit: faker.helpers.arrayElement([250, 500, 750, 1000]),
          required: true,
        },
      ]
    : undefined

  // Required documents
  const requiredDocuments: string[] = ['Transcript']
  if (Math.random() > 0.5) requiredDocuments.push('Resume')
  if (Math.random() > 0.6) requiredDocuments.push('Personal Statement')
  if (Math.random() > 0.8) requiredDocuments.push('FAFSA SAR')

  // Recommendations
  const recommendationCount = faker.helpers.arrayElement([0, 0, 1, 1, 2, 2, 3])

  // Competition metadata (50% have this data)
  const applicantPoolSize = Math.random() > 0.5 ? faker.number.int({ min: 100, max: 5000 }) : undefined
  const acceptanceRate = applicantPoolSize ? faker.number.float({ min: 0.05, max: 0.4, fractionDigits: 2 }) : undefined

  // Tags
  const tags = [category]
  if (field) tags.push(field)
  if (renewable) tags.push('Renewable')
  if (eligibilityCriteria.special?.firstGenerationRequired) tags.push('First-Generation')
  if (eligibilityCriteria.demographic?.requiredGender === 'Female') tags.push('Women')
  if (eligibilityCriteria.demographic?.requiredGender === 'Male') tags.push('Men')

  return {
    name,
    provider,
    description: `${name} by ${provider}. This scholarship supports students ${
      field ? `pursuing ${field} degrees` : 'across various fields of study'
    }. ${category === 'Merit-based' ? 'Based on academic excellence and achievement.' : ''} ${
      category === 'Need-based' ? 'Based on demonstrated financial need.' : ''
    } Applications are reviewed by a selection committee.`,
    website: `https://example.org/${faker.helpers.slugify(name.toLowerCase())}`,
    awardAmount,
    awardAmountMax,
    numberOfAwards,
    renewable,
    renewalYears,
    deadline: deadline.toISOString(),
    eligibilityCriteria,
    essayPrompts,
    requiredDocuments,
    recommendationCount,
    applicantPoolSize,
    acceptanceRate,
    sourceUrl: `https://example.org/${faker.helpers.slugify(name.toLowerCase())}`,
    tags,
    category,
    verified: true,
  }
}

/**
 * Main seed function
 */
async function seedMVP(): Promise<void> {
  console.log('🌱 Generating MVP seed dataset...\n')

  const scholarships = []

  for (let i = 0; i < TOTAL_SCHOLARSHIPS; i++) {
    scholarships.push(generateScholarship())

    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1}/${TOTAL_SCHOLARSHIPS} scholarships...`)
    }
  }

  console.log(`\n✅ Generated ${TOTAL_SCHOLARSHIPS} scholarships\n`)

  // Save to file
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const filePath = path.join(dataDir, 'mvp-scholarships-1000.json')
  fs.writeFileSync(filePath, JSON.stringify(scholarships, null, 2), 'utf-8')

  console.log(`💾 Saved to ${filePath}\n`)

  // Import the data
  console.log('📥 Importing scholarships to database...\n')

  await importScholarships(filePath, {
    dryRun: false,
    skipDuplicates: true,
    mergeDuplicates: false,
    batchSize: 100,
  })
}

// Run seed if executed directly
if (require.main === module) {
  seedMVP().catch((error) => {
    console.error('Fatal error during seeding:', error)
    process.exit(1)
  })
}

export { seedMVP }
