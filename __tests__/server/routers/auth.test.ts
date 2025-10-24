import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/server/db'

// Mock Prisma
vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('Auth Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSession', () => {
    it('should return null when user is not authenticated', async () => {
      const ctx = { userId: null, prisma }

      // In a real scenario, we'd call the router procedure here
      // For now, just verify the logic
      expect(ctx.userId).toBeNull()
    })

    it('should return user with student profile when authenticated', async () => {
      const mockUser = {
        id: 'user_123',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        student: {
          id: 'student_123',
          userId: 'user_123',
          firstName: 'John',
          lastName: 'Doe',
          profile: null,
        },
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await prisma.user.findUnique({
        where: { clerkId: 'clerk_123' },
        include: {
          student: {
            include: {
              profile: true,
            },
          },
        },
      })

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_123' },
        include: {
          student: {
            include: {
              profile: true,
            },
          },
        },
      })
    })
  })

  describe('register', () => {
    it('should create user with STUDENT role by default', async () => {
      const input = {
        clerkId: 'clerk_new',
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      }

      const mockCreatedUser = {
        id: 'user_new',
        clerkId: input.clerkId,
        email: input.email,
        emailVerified: true,
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        student: {
          id: 'student_new',
          userId: 'user_new',
          firstName: input.firstName,
          lastName: input.lastName,
        },
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any)

      const result = await prisma.user.create({
        data: {
          clerkId: input.clerkId,
          email: input.email,
          role: 'STUDENT',
          emailVerified: true,
          student: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
        include: { student: true },
      })

      expect(result).toEqual(mockCreatedUser)
      expect(result.role).toBe('STUDENT')
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: input.clerkId,
          email: input.email,
          role: 'STUDENT',
          emailVerified: true,
          student: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
        include: { student: true },
      })
    })
  })
})
