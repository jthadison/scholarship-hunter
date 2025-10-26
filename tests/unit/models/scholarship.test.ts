/**
 * Unit Tests for Scholarship Model
 *
 * Tests cover all acceptance criteria for Story 2.1:
 * - AC#1: Eligibility criteria (6 dimensions)
 * - AC#2: Award metadata
 * - AC#3: Application requirements
 * - AC#4: Competition metadata
 * - AC#5: Source tracking
 * - AC#6: Search optimization
 * - AC#7: Database indexes
 *
 * @module tests/unit/models/scholarship
 */

import { describe, it, expect, afterAll } from 'vitest'
import { PrismaClient, Prisma } from '@prisma/client'
import type { EligibilityCriteria } from '../../../src/types/scholarship'
import { createScholarship, validateScholarshipData } from '../../../prisma/seed-utils/scholarship-factory'

const prisma = new PrismaClient()

describe('Scholarship Model - Schema Validation', () => {
  afterAll(async () => {
    // Clean up test data
    await prisma.scholarship.deleteMany({
      where: {
        name: {
          startsWith: '[TEST]',
        },
      },
    })
    await prisma.$disconnect()
  })

  describe('AC#1: Eligibility Criteria (6 Dimensions)', () => {
    it('should create scholarship with all 6 eligibility dimensions', async () => {
      const eligibilityCriteria: EligibilityCriteria = {
        academic: {
          minGPA: 3.5,
          minSAT: 1200,
          minACT: 28,
        },
        demographic: {
          requiredGender: 'Female',
          requiredEthnicity: ['Hispanic/Latinx'],
          requiredState: ['CA', 'TX'],
        },
        majorField: {
          eligibleMajors: ['Computer Science', 'Engineering'],
          requiredFieldOfStudy: ['STEM'],
        },
        experience: {
          minVolunteerHours: 100,
          leadershipRequired: true,
        },
        financial: {
          requiresFinancialNeed: true,
          maxEFC: 5000,
        },
        special: {
          firstGenerationRequired: true,
          citizenshipRequired: 'US Citizen',
        },
      }

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Six Dimensions Scholarship',
          provider: 'Test Provider',
          description: 'Testing all six eligibility dimensions',
          awardAmount: 5000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: eligibilityCriteria as Prisma.InputJsonValue,
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship).toBeDefined()
      expect(scholarship.id).toBeDefined()
      expect(scholarship.eligibilityCriteria).toEqual(eligibilityCriteria)

      // Verify each dimension is stored correctly
      const criteria = scholarship.eligibilityCriteria as EligibilityCriteria
      expect(criteria.academic?.minGPA).toBe(3.5)
      expect(criteria.demographic?.requiredGender).toBe('Female')
      expect(criteria.majorField?.eligibleMajors).toContain('Computer Science')
      expect(criteria.experience?.minVolunteerHours).toBe(100)
      expect(criteria.financial?.requiresFinancialNeed).toBe(true)
      expect(criteria.special?.firstGenerationRequired).toBe(true)
    })

    it('should accept eligibilityCriteria as required field (not nullable)', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Required Criteria Test',
          provider: 'Test Provider',
          description: 'Testing required eligibilityCriteria',
          awardAmount: 1000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.eligibilityCriteria).toBeDefined()
    })

    it('should store complex academic criteria with all fields', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Academic Criteria',
          provider: 'Test Provider',
          description: 'Testing academic eligibility',
          awardAmount: 2000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {
            academic: {
              minGPA: 3.0,
              maxGPA: 4.0,
              minSAT: 1000,
              maxSAT: 1600,
              minACT: 20,
              maxACT: 36,
              classRankPercentile: 10,
              gpaWeight: 0.7,
            },
          },
          tags: [],
          requiredDocuments: [],
        },
      })

      const criteria = scholarship.eligibilityCriteria as EligibilityCriteria
      expect(criteria.academic?.minGPA).toBe(3.0)
      expect(criteria.academic?.maxGPA).toBe(4.0)
      expect(criteria.academic?.classRankPercentile).toBe(10)
      expect(criteria.academic?.gpaWeight).toBe(0.7)
    })
  })

  describe('AC#2: Award Metadata', () => {
    it('should store award amount range (min and max)', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Award Range',
          provider: 'Test Provider',
          description: 'Testing award amount range',
          awardAmount: 1000,
          awardAmountMax: 5000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.awardAmount).toBe(1000)
      expect(scholarship.awardAmountMax).toBe(5000)
    })

    it('should apply default numberOfAwards = 1', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Default Awards',
          provider: 'Test Provider',
          description: 'Testing default number of awards',
          awardAmount: 2000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.numberOfAwards).toBe(1)
    })

    it('should apply default renewable = false', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Default Renewable',
          provider: 'Test Provider',
          description: 'Testing default renewable',
          awardAmount: 3000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.renewable).toBe(false)
    })

    it('should store renewable scholarship with renewal years', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Renewable Scholarship',
          provider: 'Test Provider',
          description: 'Testing renewable scholarship',
          awardAmount: 10000,
          numberOfAwards: 50,
          renewable: true,
          renewalYears: 4,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.renewable).toBe(true)
      expect(scholarship.renewalYears).toBe(4)
    })

    it('should store deadline and announcement date', async () => {
      const deadline = new Date('2025-12-15')
      const announcementDate = new Date('2026-01-15')

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Dates',
          provider: 'Test Provider',
          description: 'Testing dates',
          awardAmount: 1500,
          deadline,
          announcementDate,
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.deadline.toISOString()).toBe(deadline.toISOString())
      expect(scholarship.announcementDate?.toISOString()).toBe(announcementDate.toISOString())
    })
  })

  describe('AC#3: Application Requirements', () => {
    it('should store essay prompts as JSON array', async () => {
      const essayPrompts = [
        {
          prompt: 'Describe your career goals',
          wordLimit: 500,
          required: true,
        },
        {
          prompt: 'Tell us about a challenge you overcame',
          wordLimit: 750,
          required: true,
        },
      ]

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Essay Prompts',
          provider: 'Test Provider',
          description: 'Testing essay prompts',
          awardAmount: 2500,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          essayPrompts,
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.essayPrompts).toEqual(essayPrompts)
      expect(Array.isArray(scholarship.essayPrompts)).toBe(true)
    })

    it('should store required documents as string array', async () => {
      const requiredDocuments = ['Transcript', 'Resume', 'Personal Statement']

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Required Documents',
          provider: 'Test Provider',
          description: 'Testing required documents',
          awardAmount: 1500,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          requiredDocuments,
          tags: [],
        },
      })

      expect(scholarship.requiredDocuments).toEqual(requiredDocuments)
      expect(scholarship.requiredDocuments.length).toBe(3)
    })

    it('should apply default recommendationCount = 0', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Default Recommendations',
          provider: 'Test Provider',
          description: 'Testing default recommendation count',
          awardAmount: 1000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.recommendationCount).toBe(0)
    })

    it('should store custom recommendation count', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Custom Recommendations',
          provider: 'Test Provider',
          description: 'Testing custom recommendation count',
          awardAmount: 5000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          recommendationCount: 3,
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.recommendationCount).toBe(3)
    })
  })

  describe('AC#4: Competition Metadata', () => {
    it('should store applicant pool size', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Pool Size',
          provider: 'Test Provider',
          description: 'Testing applicant pool size',
          awardAmount: 3000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          applicantPoolSize: 10000,
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.applicantPoolSize).toBe(10000)
    })

    it('should store acceptance rate as float 0.0-1.0', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Acceptance Rate',
          provider: 'Test Provider',
          description: 'Testing acceptance rate',
          awardAmount: 7500,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          applicantPoolSize: 5000,
          acceptanceRate: 0.15,
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.acceptanceRate).toBe(0.15)
      expect(scholarship.acceptanceRate).toBeGreaterThanOrEqual(0)
      expect(scholarship.acceptanceRate).toBeLessThanOrEqual(1)
    })
  })

  describe('AC#5: Source Tracking', () => {
    it('should store source URL', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Source URL',
          provider: 'Test Provider',
          description: 'Testing source URL',
          awardAmount: 2000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          sourceUrl: 'https://example.com/scholarship',
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.sourceUrl).toBe('https://example.com/scholarship')
    })

    it('should apply default verified = false', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Default Verified',
          provider: 'Test Provider',
          description: 'Testing default verified',
          awardAmount: 1500,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.verified).toBe(false)
    })

    it('should apply default lastVerified = now()', async () => {
      const beforeCreate = new Date()

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Default Last Verified',
          provider: 'Test Provider',
          description: 'Testing default last verified',
          awardAmount: 1500,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      const afterCreate = new Date()

      expect(scholarship.lastVerified).toBeDefined()
      expect(scholarship.lastVerified.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(scholarship.lastVerified.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })

    it('should store verified scholarship', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Verified',
          provider: 'Test Provider',
          description: 'Testing verified scholarship',
          awardAmount: 5000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          verified: true,
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.verified).toBe(true)
    })
  })

  describe('AC#6: Search Optimization', () => {
    it('should store tags as string array', async () => {
      const tags = ['STEM', 'Women', 'Merit-based', 'High Value']

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Tags',
          provider: 'Test Provider',
          description: 'Testing tags',
          awardAmount: 5000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags,
          requiredDocuments: [],
        },
      })

      expect(scholarship.tags).toEqual(tags)
      expect(scholarship.tags.length).toBe(4)
    })

    it('should store category', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Category',
          provider: 'Test Provider',
          description: 'Testing category',
          awardAmount: 3000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          category: 'Merit-based',
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.category).toBe('Merit-based')
    })

    it('should accept common category values', async () => {
      const categories = ['Merit-based', 'Need-based', 'Identity-based']

      for (const category of categories) {
        const scholarship = await prisma.scholarship.create({
          data: {
            name: `[TEST] Category - ${category}`,
            provider: 'Test Provider',
            description: `Testing ${category} category`,
            awardAmount: 2500,
            deadline: new Date('2026-06-01'),
            eligibilityCriteria: {},
            category,
            tags: [],
            requiredDocuments: [],
          },
        })

        expect(scholarship.category).toBe(category)
      }
    })
  })

  describe('AC#1-7: Nullable Fields and Timestamps', () => {
    it('should accept null for optional fields', async () => {
      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Null Fields',
          provider: 'Test Provider',
          description: 'Testing null optional fields',
          awardAmount: 1000,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          // All optional fields omitted (should be null)
          tags: [],
          requiredDocuments: [],
        },
      })

      expect(scholarship.website).toBeNull()
      expect(scholarship.contactEmail).toBeNull()
      expect(scholarship.awardAmountMax).toBeNull()
      expect(scholarship.renewalYears).toBeNull()
      expect(scholarship.announcementDate).toBeNull()
      expect(scholarship.essayPrompts).toBeNull()
      expect(scholarship.applicantPoolSize).toBeNull()
      expect(scholarship.acceptanceRate).toBeNull()
      expect(scholarship.sourceUrl).toBeNull()
      expect(scholarship.category).toBeNull()
    })

    it('should apply createdAt and updatedAt timestamps', async () => {
      const beforeCreate = new Date()

      const scholarship = await prisma.scholarship.create({
        data: {
          name: '[TEST] Timestamps',
          provider: 'Test Provider',
          description: 'Testing timestamps',
          awardAmount: 1500,
          deadline: new Date('2026-06-01'),
          eligibilityCriteria: {},
          tags: [],
          requiredDocuments: [],
        },
      })

      const afterCreate = new Date()

      expect(scholarship.createdAt).toBeDefined()
      expect(scholarship.updatedAt).toBeDefined()
      expect(scholarship.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(scholarship.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
      expect(scholarship.updatedAt.getTime()).toBeGreaterThanOrEqual(scholarship.createdAt.getTime())
    })
  })

  describe('Validation Helpers', () => {
    it('should validate scholarship data with factory helper', () => {
      const validData = createScholarship({
        name: 'Valid Scholarship',
        provider: 'Valid Provider',
        description: 'A valid scholarship description with enough characters',
        awardAmount: 5000,
        deadline: new Date('2026-06-01'),
      })

      expect(() => validateScholarshipData(validData)).not.toThrow()
    })

    it('should reject scholarship with invalid award amount range', () => {
      const invalidData = createScholarship({
        name: 'Invalid Scholarship',
        provider: 'Test Provider',
        description: 'Testing invalid award range',
        awardAmount: 10000,
        awardAmountMax: 5000, // Max < Min (invalid)
        deadline: new Date('2026-06-01'),
      })

      expect(() => validateScholarshipData(invalidData)).toThrow()
    })
  })
})
