import { describe, it, expect, beforeEach, vi } from 'vitest'
import { profileRouter } from '@/server/routers/profile'
import { prisma } from '@/server/db'
import { FinancialNeed } from '@prisma/client'

// Mock prisma
vi.mock('@/server/db', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
    profile: {
      create: vi.fn(),
      update: vi.fn(),
    },
    profileHistory: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

describe('Profile Router - Integration Tests', () => {
  const mockCtx = {
    userId: 'test-user-id',
    prisma,
  }

  const mockStudent = {
    id: 'student-123',
    userId: 'test-user-id',
    firstName: 'John',
    lastName: 'Doe',
    profile: null,
  }

  const mockProfile = {
    id: 'profile-123',
    studentId: 'student-123',
    gpa: 3.8,
    gpaScale: 4.0,
    satScore: 1450,
    actScore: null,
    classRank: 15,
    classSize: 300,
    graduationYear: 2025,
    currentGrade: '12th Grade' as const,
    gender: 'Male',
    ethnicity: ['Asian' as const],
    state: 'CA' as const,
    city: 'Los Angeles',
    zipCode: '90210',
    citizenship: 'US Citizen' as const,
    financialNeed: FinancialNeed.MODERATE,
    pellGrantEligible: false,
    efcRange: '$5,001-$10,000' as const,
    completionPercentage: 100,
    strengthScore: 0,
    intendedMajor: null,
    fieldOfStudy: null,
    careerGoals: null,
    extracurriculars: null,
    volunteerHours: 0,
    workExperience: null,
    leadershipRoles: null,
    awardsHonors: null,
    firstGeneration: false,
    militaryAffiliation: null,
    disabilities: null,
    additionalContext: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('profile.get', () => {
    it('should return profile for authenticated user', async () => {
      const studentWithProfile = {
        ...mockStudent,
        profile: mockProfile,
      }

      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        studentWithProfile as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)
      const result = await caller.get()

      expect(result).toEqual(mockProfile)
      expect(prisma.student.findUnique).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        include: { profile: true },
      })
    })

    it('should return null when profile does not exist', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        mockStudent as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)
      const result = await caller.get()

      expect(result).toBeNull()
    })

    it('should throw NOT_FOUND when student record does not exist', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(null)

      const caller = profileRouter.createCaller(mockCtx as any)

      await expect(caller.get()).rejects.toThrow('Student record not found')
    })
  })

  describe('profile.create', () => {
    const createInput = {
      gpa: 3.8,
      gpaScale: 4.0,
      graduationYear: 2025,
      state: 'CA' as const,
      citizenship: 'US Citizen' as const,
      financialNeed: FinancialNeed.MODERATE,
    }

    it('should create profile with valid input', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        mockStudent as any
      )
      vi.mocked(prisma.profile.create).mockResolvedValue(mockProfile as any)

      const caller = profileRouter.createCaller(mockCtx as any)
      const result = await caller.create(createInput)

      expect(result).toEqual(mockProfile)
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'student-123',
          ...createInput,
          completionPercentage: expect.any(Number),
        }),
      })
    })

    it('should calculate completionPercentage on create', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        mockStudent as any
      )
      vi.mocked(prisma.profile.create).mockResolvedValue(mockProfile as any)

      const caller = profileRouter.createCaller(mockCtx as any)
      await caller.create(createInput)

      const createCall = vi.mocked(prisma.profile.create).mock.calls[0]?.[0]
      expect(createCall?.data.completionPercentage).toBeGreaterThan(0)
      expect(createCall?.data.completionPercentage).toBeLessThanOrEqual(100)
    })

    it('should throw BAD_REQUEST when profile already exists', async () => {
      const studentWithProfile = {
        ...mockStudent,
        profile: mockProfile,
      }

      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        studentWithProfile as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)

      await expect(caller.create(createInput)).rejects.toThrow(
        'Profile already exists'
      )
    })

    it('should throw NOT_FOUND when student does not exist', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(null)

      const caller = profileRouter.createCaller(mockCtx as any)

      await expect(caller.create(createInput)).rejects.toThrow(
        'Student record not found'
      )
    })
  })

  describe('profile.update', () => {
    const updateInput = {
      gpa: 3.9,
      satScore: 1500,
    }

    it('should update profile with valid input', async () => {
      const studentWithProfile = {
        ...mockStudent,
        profile: mockProfile,
      }

      const updatedProfile = {
        ...mockProfile,
        ...updateInput,
      }

      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        studentWithProfile as any
      )
      vi.mocked(prisma.profile.update).mockResolvedValue(
        updatedProfile as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)
      const result = await caller.update(updateInput)

      expect(result.profile.gpa).toBe(3.9)
      expect(result.profile.satScore).toBe(1500)
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
        data: expect.objectContaining({
          ...updateInput,
          completionPercentage: expect.any(Number),
        }),
      })
    })

    it('should recalculate completionPercentage on update', async () => {
      const studentWithProfile = {
        ...mockStudent,
        profile: mockProfile,
      }

      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        studentWithProfile as any
      )
      vi.mocked(prisma.profile.update).mockResolvedValue(mockProfile as any)

      const caller = profileRouter.createCaller(mockCtx as any)
      await caller.update(updateInput)

      const updateCall = vi.mocked(prisma.profile.update).mock.calls[0]?.[0]
      expect(updateCall?.data.completionPercentage).toBeDefined()
    })

    it('should throw NOT_FOUND when profile does not exist', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        mockStudent as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)

      await expect(caller.update(updateInput)).rejects.toThrow(
        'Profile not found'
      )
    })
  })

  describe('profile.getCompleteness', () => {
    it('should return completeness details for existing profile', async () => {
      const studentWithProfile = {
        ...mockStudent,
        profile: mockProfile,
      }

      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        studentWithProfile as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)
      const result = await caller.getCompleteness()

      expect(result).toHaveProperty('completionPercentage')
      expect(result).toHaveProperty('requiredFieldsComplete')
      expect(result).toHaveProperty('requiredFieldsTotal')
      expect(result).toHaveProperty('optionalFieldsComplete')
      expect(result).toHaveProperty('missingRequired')
      expect(result).toHaveProperty('missingRecommended')
    })

    it('should return 0% completeness when no profile exists', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue(
        mockStudent as any
      )

      const caller = profileRouter.createCaller(mockCtx as any)
      const result = await caller.getCompleteness()

      expect(result.completionPercentage).toBe(0)
      expect(result.requiredFieldsComplete).toBe(0)
      expect(result.missingRequired.length).toBeGreaterThan(0)
    })
  })
})
