import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { calculateProgressPercentage, isApplicationComplete } from '../../src/types/application'

const prisma = new PrismaClient()

describe('Application Model Integration Tests', () => {
  let testStudentId: string
  let testScholarshipId: string

  beforeAll(async () => {
    // Create test student
    const user = await prisma.user.create({
      data: {
        clerkId: `test_clerk_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        role: 'STUDENT',
      },
    })

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        firstName: 'Test',
        lastName: 'Student',
      },
    })

    testStudentId = student.id

    // Create test scholarship
    const scholarship = await prisma.scholarship.create({
      data: {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        description: 'Test Description',
        awardAmount: 5000,
        deadline: new Date('2025-12-31'),
        eligibilityCriteria: {},
      },
    })

    testScholarshipId = scholarship.id
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.application.deleteMany({ where: { studentId: testStudentId } })
    await prisma.scholarship.deleteMany({ where: { id: testScholarshipId } })
    await prisma.student.deleteMany({ where: { id: testStudentId } })
    await prisma.user.deleteMany({ where: { id: { contains: 'test_clerk_' } } })
    await prisma.$disconnect()
  })

  describe('AC1: Application table links students to scholarships with status tracking', () => {
    it('should create an application linking student to scholarship', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
          status: 'NOT_STARTED',
        },
      })

      expect(application).toBeDefined()
      expect(application.studentId).toBe(testStudentId)
      expect(application.scholarshipId).toBe(testScholarshipId)
      expect(application.status).toBe('NOT_STARTED')

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should retrieve application with student and scholarship relations', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
          status: 'TODO',
        },
      })

      const retrieved = await prisma.application.findUnique({
        where: { id: application.id },
        include: {
          student: true,
          scholarship: true,
        },
      })

      expect(retrieved).toBeDefined()
      expect(retrieved?.student.id).toBe(testStudentId)
      expect(retrieved?.scholarship.id).toBe(testScholarshipId)

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })
  })

  describe('AC2: Status values (9 states)', () => {
    it('should accept all 9 valid status values', async () => {
      const statuses = [
        'NOT_STARTED',
        'TODO',
        'IN_PROGRESS',
        'READY_FOR_REVIEW',
        'SUBMITTED',
        'AWAITING_DECISION',
        'AWARDED',
        'DENIED',
        'WITHDRAWN',
      ] as const

      for (const status of statuses) {
        // Create unique scholarship for each status test
        const scholarship = await prisma.scholarship.create({
          data: {
            name: `Test Scholarship ${status}`,
            provider: 'Test Provider',
            description: 'Test Description',
            awardAmount: 5000,
            deadline: new Date('2025-12-31'),
            eligibilityCriteria: {},
          },
        })

        const application = await prisma.application.create({
          data: {
            studentId: testStudentId,
            scholarshipId: scholarship.id,
            status,
          },
        })

        expect(application.status).toBe(status)

        // Cleanup
        await prisma.application.delete({ where: { id: application.id } })
        await prisma.scholarship.delete({ where: { id: scholarship.id } })
      }
    }, 15000) // Increase timeout for multiple operations

    it('should default to NOT_STARTED if status not provided', async () => {
      // Create unique scholarship
      const scholarship = await prisma.scholarship.create({
        data: {
          name: 'Test Scholarship Default Status',
          provider: 'Test Provider',
          description: 'Test Description',
          awardAmount: 5000,
          deadline: new Date('2025-12-31'),
          eligibilityCriteria: {},
        },
      })

      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: scholarship.id,
        },
      })

      expect(application.status).toBe('NOT_STARTED')

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
      await prisma.scholarship.delete({ where: { id: scholarship.id } })
    })
  })

  describe('AC3: Metadata fields', () => {
    it('should store all metadata fields correctly', async () => {
      const now = new Date()
      const targetDate = new Date('2025-12-15')
      const submitDate = new Date('2025-12-14')
      const outcomeDate = new Date('2026-01-15')

      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
          status: 'AWARDED',
          targetSubmitDate: targetDate,
          actualSubmitDate: submitDate,
          outcomeDate: outcomeDate,
          awardAmount: 5000,
        },
      })

      expect(application.dateAdded).toBeInstanceOf(Date)
      expect(application.targetSubmitDate).toEqual(targetDate)
      expect(application.actualSubmitDate).toEqual(submitDate)
      expect(application.outcomeDate).toEqual(outcomeDate)
      expect(application.awardAmount).toBe(5000)

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should auto-populate dateAdded on creation', async () => {
      const beforeCreate = new Date()

      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      const afterCreate = new Date()

      expect(application.dateAdded.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(application.dateAdded.getTime()).toBeLessThanOrEqual(afterCreate.getTime())

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should allow null for optional metadata fields', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      expect(application.targetSubmitDate).toBeNull()
      expect(application.actualSubmitDate).toBeNull()
      expect(application.outcomeDate).toBeNull()
      expect(application.awardAmount).toBeNull()

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })
  })

  describe('AC4: Progress tracking', () => {
    it('should store all progress tracking fields correctly', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
          essayCount: 3,
          essayComplete: 2,
          documentsRequired: 4,
          documentsUploaded: 3,
          recsRequired: 2,
          recsReceived: 1,
          progressPercentage: 66.67,
        },
      })

      expect(application.essayCount).toBe(3)
      expect(application.essayComplete).toBe(2)
      expect(application.documentsRequired).toBe(4)
      expect(application.documentsUploaded).toBe(3)
      expect(application.recsRequired).toBe(2)
      expect(application.recsReceived).toBe(1)
      expect(application.progressPercentage).toBeCloseTo(66.67, 1)

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should default progress fields to 0', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      expect(application.essayCount).toBe(0)
      expect(application.essayComplete).toBe(0)
      expect(application.documentsRequired).toBe(0)
      expect(application.documentsUploaded).toBe(0)
      expect(application.recsRequired).toBe(0)
      expect(application.recsReceived).toBe(0)
      expect(application.progressPercentage).toBe(0)

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should calculate progress percentage correctly (helper function)', () => {
      // Test normal case
      const progress1 = {
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 2,
        recsRequired: 2,
        recsReceived: 1,
        progressPercentage: 0,
      }
      expect(calculateProgressPercentage(progress1)).toBe(71) // (2+2+1)/(2+3+2)*100 = 71

      // Test edge case: 0/0 = 0%
      const progress2 = {
        essayCount: 0,
        essayComplete: 0,
        documentsRequired: 0,
        documentsUploaded: 0,
        recsRequired: 0,
        recsReceived: 0,
        progressPercentage: 0,
      }
      expect(calculateProgressPercentage(progress2)).toBe(0)

      // Test 100% complete
      const progress3 = {
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 2,
        recsReceived: 2,
        progressPercentage: 0,
      }
      expect(calculateProgressPercentage(progress3)).toBe(100)
    })

    it('should correctly identify complete applications', () => {
      const complete = {
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 2,
        recsReceived: 2,
        progressPercentage: 100,
      }
      expect(isApplicationComplete(complete)).toBe(true)

      const incomplete = {
        essayCount: 2,
        essayComplete: 1,
        documentsRequired: 3,
        documentsUploaded: 3,
        recsRequired: 2,
        recsReceived: 2,
        progressPercentage: 85,
      }
      expect(isApplicationComplete(incomplete)).toBe(false)
    })
  })

  describe('AC5: Timeline model with milestone dates', () => {
    it('should create timeline with one-to-one relation to application', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      const timeline = await prisma.timeline.create({
        data: {
          applicationId: application.id,
          startEssayDate: new Date('2025-11-10'),
          requestRecsDate: new Date('2025-11-17'),
          uploadDocsDate: new Date('2025-11-24'),
          finalReviewDate: new Date('2025-11-28'),
          submitDate: new Date('2025-11-30'),
        },
      })

      expect(timeline).toBeDefined()
      expect(timeline.applicationId).toBe(application.id)

      // Verify one-to-one relation
      const appWithTimeline = await prisma.application.findUnique({
        where: { id: application.id },
        include: { timeline: true },
      })

      expect(appWithTimeline?.timeline?.id).toBe(timeline.id)

      // Cleanup
      await prisma.timeline.delete({ where: { id: timeline.id } })
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should store all 5 milestone dates', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      const startEssay = new Date('2025-11-10')
      const requestRecs = new Date('2025-11-17')
      const uploadDocs = new Date('2025-11-24')
      const finalReview = new Date('2025-11-28')
      const submit = new Date('2025-11-30')

      const timeline = await prisma.timeline.create({
        data: {
          applicationId: application.id,
          startEssayDate: startEssay,
          requestRecsDate: requestRecs,
          uploadDocsDate: uploadDocs,
          finalReviewDate: finalReview,
          submitDate: submit,
        },
      })

      expect(timeline.startEssayDate).toEqual(startEssay)
      expect(timeline.requestRecsDate).toEqual(requestRecs)
      expect(timeline.uploadDocsDate).toEqual(uploadDocs)
      expect(timeline.finalReviewDate).toEqual(finalReview)
      expect(timeline.submitDate).toEqual(submit)

      // Cleanup
      await prisma.timeline.delete({ where: { id: timeline.id } })
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should allow nullable milestone dates', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      const timeline = await prisma.timeline.create({
        data: {
          applicationId: application.id,
        },
      })

      expect(timeline.startEssayDate).toBeNull()
      expect(timeline.requestRecsDate).toBeNull()
      expect(timeline.uploadDocsDate).toBeNull()
      expect(timeline.finalReviewDate).toBeNull()
      expect(timeline.submitDate).toBeNull()

      // Cleanup
      await prisma.timeline.delete({ where: { id: timeline.id } })
      await prisma.application.delete({ where: { id: application.id } })
    })
  })

  describe('AC6: Notes field', () => {
    it('should store free-text notes', async () => {
      const longNote = 'This is a long note with multiple paragraphs.\n\nSecond paragraph here.\n\nThird paragraph with special characters: @#$%^&*()'

      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
          notes: longNote,
        },
      })

      expect(application.notes).toBe(longNote)

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should allow null notes', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      expect(application.notes).toBeNull()

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })
  })

  describe('AC7: Database indexes and constraints', () => {
    it('should enforce unique constraint on [studentId, scholarshipId]', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      // Attempt to create duplicate should fail
      await expect(
        prisma.application.create({
          data: {
            studentId: testStudentId,
            scholarshipId: testScholarshipId,
          },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } })
    })

    it('should allow same student to apply to multiple scholarships', async () => {
      // Create second scholarship
      const scholarship2 = await prisma.scholarship.create({
        data: {
          name: 'Second Test Scholarship',
          provider: 'Test Provider',
          description: 'Test Description',
          awardAmount: 3000,
          deadline: new Date('2025-11-30'),
          eligibilityCriteria: {},
        },
      })

      const app1 = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      const app2 = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: scholarship2.id,
        },
      })

      expect(app1.id).not.toBe(app2.id)
      expect(app1.scholarshipId).not.toBe(app2.scholarshipId)

      // Cleanup
      await prisma.application.delete({ where: { id: app1.id } })
      await prisma.application.delete({ where: { id: app2.id } })
      await prisma.scholarship.delete({ where: { id: scholarship2.id } })
    })

    it('should cascade delete timeline when application is deleted', async () => {
      const application = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
        },
      })

      const timeline = await prisma.timeline.create({
        data: {
          applicationId: application.id,
          startEssayDate: new Date(),
        },
      })

      // Delete application
      await prisma.application.delete({ where: { id: application.id } })

      // Timeline should be automatically deleted
      const deletedTimeline = await prisma.timeline.findUnique({
        where: { id: timeline.id },
      })

      expect(deletedTimeline).toBeNull()
    })

    it('should efficiently query applications by studentId and status (compound index)', async () => {
      // Create multiple applications with different statuses
      const app1 = await prisma.application.create({
        data: {
          studentId: testStudentId,
          scholarshipId: testScholarshipId,
          status: 'TODO',
        },
      })

      // Query using compound index
      const applications = await prisma.application.findMany({
        where: {
          studentId: testStudentId,
          status: 'TODO',
        },
      })

      expect(applications.length).toBeGreaterThan(0)
      expect(applications[0]?.status).toBe('TODO')

      // Cleanup
      await prisma.application.delete({ where: { id: app1.id } })
    })
  })
})
