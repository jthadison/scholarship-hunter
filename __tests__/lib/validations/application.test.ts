import { describe, it, expect } from 'vitest'
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  applicationStatusTransitionSchema,
  applicationFilterSchema,
} from '../../../src/lib/validations/application'

describe('Application Validation Schemas', () => {
  describe('applicationCreateSchema', () => {
    it('should validate a complete valid application', () => {
      const validApplication = {
        studentId: 'clabcdef1234567890',
        scholarshipId: 'clxyz1234567890abc',
        status: 'IN_PROGRESS',
        priorityTier: 'MUST_APPLY',
        essayCount: 2,
        essayComplete: 2,
        documentsRequired: 3,
        documentsUploaded: 2,
        recsRequired: 2,
        recsReceived: 1,
        progressPercentage: 75,
        targetSubmitDate: new Date('2025-12-31'),
        awardAmount: 5000,
        notes: 'Working on essays',
      }

      const result = applicationCreateSchema.safeParse(validApplication)
      expect(result.success).toBe(true)
    })

    it('should validate application with only required fields', () => {
      const minimalApplication = {
        studentId: 'clabcdef1234567890',
        scholarshipId: 'clxyz1234567890abc',
      }

      const result = applicationCreateSchema.safeParse(minimalApplication)
      expect(result.success).toBe(true)
    })

    describe('Progress percentage validation', () => {
      it('should accept progress of 0%', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          progressPercentage: 0,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept progress of 100%', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          progressPercentage: 100,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept progress of 50%', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          progressPercentage: 50,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should reject progress below 0%', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          progressPercentage: -1,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })

      it('should reject progress above 100%', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          progressPercentage: 101,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })
    })

    describe('Document tracking validation', () => {
      it('should accept when uploaded equals required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          documentsRequired: 3,
          documentsUploaded: 3,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept when uploaded less than required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          documentsRequired: 3,
          documentsUploaded: 2,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should reject when uploaded exceeds required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          documentsRequired: 2,
          documentsUploaded: 3,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('documentsUploaded')
        }
      })

      it('should reject negative documentsRequired', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          documentsRequired: -1,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })
    })

    describe('Essay tracking validation', () => {
      it('should accept when complete equals count', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          essayCount: 3,
          essayComplete: 3,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept when complete less than count', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          essayCount: 3,
          essayComplete: 2,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should reject when complete exceeds count', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          essayCount: 2,
          essayComplete: 3,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('essayComplete')
        }
      })

      it('should reject negative essayComplete', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          essayComplete: -1,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })
    })

    describe('Award amount validation', () => {
      it('should accept valid positive award amount', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          awardAmount: 5000,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept optional award amount (undefined)', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should reject negative award amount', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          awardAmount: -1000,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })

      it('should reject zero award amount', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          awardAmount: 0,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })
    })

    describe('Recommendation tracking validation', () => {
      it('should accept 0 to 5 recommendations required', () => {
        for (let i = 0; i <= 5; i++) {
          const application = {
            studentId: 'clabcdef1234567890',
            scholarshipId: 'clxyz1234567890abc',
            recsRequired: i,
            recsReceived: i,
          }
          const result = applicationCreateSchema.safeParse(application)
          expect(result.success).toBe(true)
        }
      })

      it('should reject more than 5 recommendations required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          recsRequired: 6,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })

      it('should accept when received equals required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          recsRequired: 2,
          recsReceived: 2,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept when received less than required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          recsRequired: 2,
          recsReceived: 1,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should reject when received exceeds required', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          recsRequired: 1,
          recsReceived: 2,
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('recsReceived')
        }
      })
    })

    describe('Status and date validation', () => {
      it('should accept SUBMITTED status with actual submit date', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          status: 'SUBMITTED',
          actualSubmitDate: new Date(),
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should accept AWAITING_DECISION status with actual submit date', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          status: 'AWAITING_DECISION',
          actualSubmitDate: new Date(),
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(true)
      })

      it('should reject IN_PROGRESS status with actual submit date', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          status: 'IN_PROGRESS',
          actualSubmitDate: new Date(),
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('status')
        }
      })
    })

    describe('Enum validation', () => {
      it('should accept valid status enum values', () => {
        const validStatuses = [
          'NOT_STARTED',
          'TODO',
          'IN_PROGRESS',
          'READY_FOR_REVIEW',
          'SUBMITTED',
          'AWAITING_DECISION',
          'AWARDED',
          'DENIED',
          'WITHDRAWN',
        ]

        validStatuses.forEach((status) => {
          const application = {
            studentId: 'clabcdef1234567890',
            scholarshipId: 'clxyz1234567890abc',
            status,
          }
          const result = applicationCreateSchema.safeParse(application)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid status enum value', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          status: 'INVALID_STATUS',
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })

      it('should accept valid priorityTier enum values', () => {
        const validTiers = ['MUST_APPLY', 'SHOULD_APPLY', 'IF_TIME_PERMITS', 'HIGH_VALUE_REACH']

        validTiers.forEach((tier) => {
          const application = {
            studentId: 'clabcdef1234567890',
            scholarshipId: 'clxyz1234567890abc',
            priorityTier: tier,
          }
          const result = applicationCreateSchema.safeParse(application)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid priorityTier enum value', () => {
        const application = {
          studentId: 'clabcdef1234567890',
          scholarshipId: 'clxyz1234567890abc',
          priorityTier: 'INVALID_TIER',
        }
        const result = applicationCreateSchema.safeParse(application)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('applicationUpdateSchema', () => {
    it('should allow updating any field except IDs', () => {
      const update = {
        status: 'IN_PROGRESS',
        progressPercentage: 50,
        notes: 'Making progress',
      }
      const result = applicationUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should allow empty update object', () => {
      const update = {}
      const result = applicationUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should not allow updating studentId', () => {
      const update = {
        studentId: 'clabcdef1234567890',
        status: 'IN_PROGRESS',
      }
      const result = applicationUpdateSchema.safeParse(update)
      // studentId should be omitted from update schema
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('studentId')
      }
    })

    it('should not allow updating scholarshipId', () => {
      const update = {
        scholarshipId: 'clxyz1234567890abc',
        status: 'IN_PROGRESS',
      }
      const result = applicationUpdateSchema.safeParse(update)
      // scholarshipId should be omitted from update schema
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('scholarshipId')
      }
    })
  })

  describe('applicationStatusTransitionSchema', () => {
    it('should allow valid status transitions', () => {
      const validTransitions = [
        { from: 'NOT_STARTED', to: 'TODO' },
        { from: 'TODO', to: 'IN_PROGRESS' },
        { from: 'IN_PROGRESS', to: 'READY_FOR_REVIEW' },
        { from: 'READY_FOR_REVIEW', to: 'SUBMITTED' },
        { from: 'SUBMITTED', to: 'AWAITING_DECISION' },
        { from: 'AWAITING_DECISION', to: 'AWARDED' },
        { from: 'AWAITING_DECISION', to: 'DENIED' },
        { from: 'TODO', to: 'WITHDRAWN' },
      ]

      validTransitions.forEach(({ from, to }) => {
        const transition = {
          currentStatus: from,
          newStatus: to,
        }
        const result = applicationStatusTransitionSchema.safeParse(transition)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status transitions', () => {
      const invalidTransitions = [
        { from: 'NOT_STARTED', to: 'SUBMITTED' },
        { from: 'TODO', to: 'AWARDED' },
        { from: 'AWARDED', to: 'IN_PROGRESS' }, // Terminal state
        { from: 'DENIED', to: 'TODO' }, // Terminal state
        { from: 'SUBMITTED', to: 'NOT_STARTED' }, // Backward transition
      ]

      invalidTransitions.forEach(({ from, to }) => {
        const transition = {
          currentStatus: from,
          newStatus: to,
        }
        const result = applicationStatusTransitionSchema.safeParse(transition)
        expect(result.success).toBe(false)
      })
    })

    it('should allow going back from READY_FOR_REVIEW to IN_PROGRESS', () => {
      const transition = {
        currentStatus: 'READY_FOR_REVIEW',
        newStatus: 'IN_PROGRESS',
      }
      const result = applicationStatusTransitionSchema.safeParse(transition)
      expect(result.success).toBe(true)
    })

    it('should allow withdrawing from any non-terminal status', () => {
      const statuses = ['NOT_STARTED', 'TODO', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'SUBMITTED', 'AWAITING_DECISION']

      statuses.forEach((status) => {
        const transition = {
          currentStatus: status,
          newStatus: 'WITHDRAWN',
        }
        const result = applicationStatusTransitionSchema.safeParse(transition)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('applicationFilterSchema', () => {
    it('should accept valid filter criteria', () => {
      const filter = {
        studentId: 'clabcdef1234567890',
        scholarshipId: 'clxyz1234567890abc',
        status: 'IN_PROGRESS',
        priorityTier: 'MUST_APPLY',
        targetSubmitBefore: new Date('2025-12-31'),
        targetSubmitAfter: new Date('2025-01-01'),
      }
      const result = applicationFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })

    it('should accept empty filter object', () => {
      const filter = {}
      const result = applicationFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })

    it('should validate studentId format', () => {
      const invalidFilter = {
        studentId: 'invalid-id',
      }
      const result = applicationFilterSchema.safeParse(invalidFilter)
      expect(result.success).toBe(false)
    })
  })
})
