/**
 * Scholarship Factory
 *
 * Creates test scholarships with realistic data and automatic cleanup.
 *
 * Usage:
 *   const scholarship = await scholarshipFactory.createScholarship({
 *     awardAmount: 5000,
 *     deadline: new Date('2025-12-31')
 *   })
 *
 * Features:
 *   - Faker-based realistic data generation
 *   - Override any field with custom values
 *   - Auto-cleanup on test completion
 *   - Predefined scholarship templates (merit-based, need-based, etc.)
 */

import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ScholarshipFactoryOptions {
  name?: string
  provider?: string
  description?: string
  awardAmount?: number
  awardAmountMax?: number
  deadline?: Date
  numberOfAwards?: number
  renewable?: boolean
  eligibilityCriteria?: any
  essayPrompts?: any[]
  requiredDocuments?: string[]
  recommendationCount?: number
  verified?: boolean
  tags?: string[]
  category?: string
}

export class ScholarshipFactory {
  private createdScholarshipIds: string[] = []

  /**
   * Create a scholarship with optional overrides
   *
   * @param overrides - Custom values to override defaults
   * @returns Created scholarship object
   */
  async createScholarship(overrides: ScholarshipFactoryOptions = {}) {
    const deadline = overrides.deadline || faker.date.future({ years: 1 })

    const scholarship = await prisma.scholarship.create({
      data: {
        name: overrides.name || this.generateScholarshipName(),
        provider: overrides.provider || faker.company.name(),
        description: overrides.description || faker.lorem.paragraphs(3),
        website: faker.internet.url(),
        contactEmail: faker.internet.email(),

        // Award details
        awardAmount: overrides.awardAmount ?? faker.number.int({ min: 500, max: 50000 }),
        awardAmountMax: overrides.awardAmountMax,
        numberOfAwards: overrides.numberOfAwards ?? faker.number.int({ min: 1, max: 10 }),
        renewable: overrides.renewable ?? faker.datatype.boolean(),

        // Deadlines
        deadline,
        announcementDate: faker.date.between({ from: deadline, to: new Date(deadline.getTime() + 60 * 24 * 60 * 60 * 1000) }),

        // Eligibility
        eligibilityCriteria: overrides.eligibilityCriteria || this.generateEligibilityCriteria(),

        // Application requirements
        essayPrompts: overrides.essayPrompts || this.generateEssayPrompts(),
        requiredDocuments: overrides.requiredDocuments || ['TRANSCRIPT', 'RESUME'],
        recommendationCount: overrides.recommendationCount ?? faker.number.int({ min: 0, max: 3 }),

        // Competition metadata
        applicantPoolSize: faker.number.int({ min: 50, max: 5000 }),
        acceptanceRate: faker.number.float({ min: 0.05, max: 0.5, fractionDigits: 3 }),

        // Source
        sourceUrl: faker.internet.url(),
        lastVerified: new Date(),
        verified: overrides.verified ?? true,

        // Discovery
        tags: overrides.tags || faker.helpers.arrayElements(['STEM', 'Merit-Based', 'Need-Based', 'Underrepresented', 'First-Generation'], 3),
        category: overrides.category || faker.helpers.arrayElement(['Academic Excellence', 'Community Service', 'Leadership', 'STEM', 'Arts']),
      },
    })

    this.createdScholarshipIds.push(scholarship.id)
    return scholarship
  }

  /**
   * Create a merit-based scholarship
   */
  async createMeritScholarship(overrides: ScholarshipFactoryOptions = {}) {
    return this.createScholarship({
      ...overrides,
      category: 'Academic Excellence',
      tags: ['Merit-Based', 'GPA', 'Academic'],
      eligibilityCriteria: {
        minGPA: 3.5,
        minSAT: 1200,
        requirements: ['Strong academic record', 'Leadership experience'],
      },
    })
  }

  /**
   * Create a need-based scholarship
   */
  async createNeedBasedScholarship(overrides: ScholarshipFactoryOptions = {}) {
    return this.createScholarship({
      ...overrides,
      category: 'Financial Need',
      tags: ['Need-Based', 'Financial Aid'],
      eligibilityCriteria: {
        financialNeed: true,
        pellGrantEligible: true,
        requirements: ['Demonstrated financial need', 'FAFSA completion'],
      },
    })
  }

  /**
   * Create a STEM scholarship
   */
  async createSTEMScholarship(overrides: ScholarshipFactoryOptions = {}) {
    return this.createScholarship({
      ...overrides,
      category: 'STEM',
      tags: ['STEM', 'Science', 'Technology', 'Engineering', 'Math'],
      eligibilityCriteria: {
        intendedMajor: ['Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Biology'],
        minGPA: 3.0,
        requirements: ['STEM major or career interest'],
      },
    })
  }

  /**
   * Create multiple scholarships at once
   */
  async createMany(count: number, overrides: ScholarshipFactoryOptions = {} as any) {
    const scholarships = []
    for (let i = 0; i < count; i++) {
      scholarships.push(await this.createScholarship(overrides))
    }
    return scholarships
  }

  /**
   * Generate a realistic scholarship name
   */
  private generateScholarshipName(): string {
    const types = [
      'Excellence',
      'Achievement',
      'Leadership',
      'Innovation',
      'Legacy',
      'Future Leaders',
      'Foundation',
      'Memorial',
      'Opportunity',
    ]
    const modifiers = ['Academic', 'STEM', 'Community Service', 'Diversity', 'First-Generation', 'Women in']

    const name = faker.helpers.arrayElement([
      `${faker.company.name()} ${faker.helpers.arrayElement(types)} Scholarship`,
      `${faker.helpers.arrayElement(modifiers)} ${faker.helpers.arrayElement(types)} Award`,
      `${faker.person.lastName()} ${faker.helpers.arrayElement(['Family', 'Memorial', 'Foundation'])} Scholarship`,
    ])

    return name
  }

  /**
   * Generate realistic eligibility criteria
   */
  private generateEligibilityCriteria() {
    return {
      minGPA: faker.number.float({ min: 2.5, max: 3.8, fractionDigits: 1 }),
      graduationYears: [new Date().getFullYear(), new Date().getFullYear() + 1],
      citizenship: ['US Citizen', 'Permanent Resident'],
      requirements: [faker.lorem.sentence(), faker.lorem.sentence()],
    }
  }

  /**
   * Generate realistic essay prompts
   */
  private generateEssayPrompts() {
    const prompts = [
      'Describe a challenge you have overcome and how it has shaped your goals.',
      'How will this scholarship help you achieve your educational and career aspirations?',
      'Discuss a leader who has inspired you and explain their impact on your life.',
      'Explain your commitment to community service and its importance to you.',
      'Describe your academic interests and how you plan to contribute to your field.',
    ]

    const count = faker.number.int({ min: 1, max: 3 })
    return faker.helpers.arrayElements(prompts, count).map((prompt, index) => ({
      id: index + 1,
      prompt,
      wordLimit: faker.helpers.arrayElement([250, 500, 750, 1000]),
      required: true,
    }))
  }

  /**
   * Clean up all created scholarships
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    if (this.createdScholarshipIds.length === 0) return

    await prisma.scholarship.deleteMany({
      where: {
        id: {
          in: this.createdScholarshipIds,
        },
      },
    })

    this.createdScholarshipIds = []
  }
}
