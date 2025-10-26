/**
 * Application Factory
 *
 * Creates test scholarship applications with automatic cleanup.
 *
 * Usage:
 *   const app = await applicationFactory.createApplication({
 *     studentId: user.student.id,
 *     scholarshipId: scholarship.id,
 *     status: 'IN_PROGRESS'
 *   })
 *
 * Features:
 *   - Auto-generates realistic application data
 *   - Links to existing students and scholarships
 *   - Auto-cleanup on test completion
 *   - Predefined application states (draft, submitted, awarded)
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, ApplicationStatus, PriorityTier } from '@prisma/client'

const prisma = new PrismaClient()

export interface ApplicationFactoryOptions {
  studentId: string
  scholarshipId: string
  status?: ApplicationStatus
  priorityTier?: PriorityTier
  progressPercentage?: number
  essayComplete?: boolean
  documentsUploaded?: number
  recsReceived?: number
  targetSubmitDate?: Date
  actualSubmitDate?: Date
  notes?: string
}

export class ApplicationFactory {
  private createdApplicationIds: string[] = []

  /**
   * Create an application with optional overrides
   *
   * @param options - Required studentId and scholarshipId, plus optional overrides
   * @returns Created application object
   */
  async createApplication(options: ApplicationFactoryOptions) {
    const { studentId, scholarshipId, status = ApplicationStatus.NOT_STARTED } = options

    // Fetch scholarship to get requirements
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: scholarshipId },
      select: {
        essayPrompts: true,
        requiredDocuments: true,
        recommendationCount: true,
      },
    })

    const essayCount = Array.isArray(scholarship?.essayPrompts) ? (scholarship.essayPrompts as any[]).length : 0
    const docsRequired = scholarship?.requiredDocuments?.length || 0
    const recsRequired = scholarship?.recommendationCount || 0

    const application = await prisma.application.create({
      data: {
        studentId,
        scholarshipId,
        status: options.status || ApplicationStatus.NOT_STARTED,
        priorityTier: options.priorityTier || faker.helpers.arrayElement(Object.values(PriorityTier)),

        // Progress tracking
        essayCount,
        essayComplete: options.essayComplete ?? false,
        documentsRequired: docsRequired,
        documentsUploaded: options.documentsUploaded ?? 0,
        recsRequired,
        recsReceived: options.recsReceived ?? 0,
        progressPercentage: options.progressPercentage ?? this.calculateProgress(status),

        // Timeline
        targetSubmitDate: options.targetSubmitDate || faker.date.future({ years: 0.5 }),
        actualSubmitDate: options.actualSubmitDate,

        notes: options.notes || (faker.datatype.boolean() ? faker.lorem.paragraph() : null),
      },
      include: {
        scholarship: true,
        student: true,
      },
    })

    this.createdApplicationIds.push(application.id)
    return application
  }

  /**
   * Create a draft application (just started)
   */
  async createDraftApplication(studentId: string, scholarshipId: string) {
    return this.createApplication({
      studentId,
      scholarshipId,
      status: ApplicationStatus.NOT_STARTED,
      progressPercentage: 0,
      essayComplete: false,
      documentsUploaded: 0,
      recsReceived: 0,
    })
  }

  /**
   * Create an in-progress application (partially complete)
   */
  async createInProgressApplication(studentId: string, scholarshipId: string) {
    return this.createApplication({
      studentId,
      scholarshipId,
      status: ApplicationStatus.IN_PROGRESS,
      progressPercentage: faker.number.int({ min: 25, max: 75 }),
      essayComplete: faker.datatype.boolean(),
      documentsUploaded: faker.number.int({ min: 1, max: 3 }),
      recsReceived: faker.number.int({ min: 0, max: 2 }),
    })
  }

  /**
   * Create a submitted application
   */
  async createSubmittedApplication(studentId: string, scholarshipId: string) {
    const submitDate = faker.date.recent({ days: 30 })
    return this.createApplication({
      studentId,
      scholarshipId,
      status: ApplicationStatus.SUBMITTED,
      progressPercentage: 100,
      essayComplete: true,
      documentsUploaded: 3,
      recsReceived: 2,
      actualSubmitDate: submitDate,
    })
  }

  /**
   * Create an awarded application with outcome
   */
  async createAwardedApplication(studentId: string, scholarshipId: string, awardAmount?: number) {
    const application = await this.createSubmittedApplication(studentId, scholarshipId)

    // Update status to awarded
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.AWARDED,
        outcome: {
          create: {
            studentId,
            result: 'AWARDED',
            awardAmountReceived: awardAmount || faker.number.int({ min: 500, max: 10000 }),
            decisionDate: faker.date.recent({ days: 7 }),
            notes: 'Congratulations! You have been selected for this scholarship.',
          },
        },
      },
      include: {
        outcome: true,
        scholarship: true,
        student: true,
      },
    })

    return updated
  }

  /**
   * Create multiple applications for a student
   */
  async createManyForStudent(studentId: string, scholarshipIds: string[], statusMix = true) {
    const applications = []

    for (const scholarshipId of scholarshipIds) {
      let status: ApplicationStatus
      if (statusMix) {
        status = faker.helpers.arrayElement([
          ApplicationStatus.NOT_STARTED,
          ApplicationStatus.IN_PROGRESS,
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.AWAITING_DECISION,
        ])
      } else {
        status = ApplicationStatus.NOT_STARTED
      }

      applications.push(
        await this.createApplication({
          studentId,
          scholarshipId,
          status,
        })
      )
    }

    return applications
  }

  /**
   * Calculate realistic progress percentage based on status
   */
  private calculateProgress(status: ApplicationStatus): number {
    switch (status) {
      case ApplicationStatus.NOT_STARTED:
        return 0
      case ApplicationStatus.TODO:
        return faker.number.int({ min: 0, max: 15 })
      case ApplicationStatus.IN_PROGRESS:
        return faker.number.int({ min: 20, max: 80 })
      case ApplicationStatus.READY_FOR_REVIEW:
        return faker.number.int({ min: 85, max: 95 })
      case ApplicationStatus.SUBMITTED:
      case ApplicationStatus.AWAITING_DECISION:
      case ApplicationStatus.AWARDED:
      case ApplicationStatus.DENIED:
      case ApplicationStatus.WITHDRAWN:
        return 100
      default:
        return 0
    }
  }

  /**
   * Clean up all created applications
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    if (this.createdApplicationIds.length === 0) return

    await prisma.application.deleteMany({
      where: {
        id: {
          in: this.createdApplicationIds,
        },
      },
    })

    this.createdApplicationIds = []
  }
}
