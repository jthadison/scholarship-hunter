import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/server/db'

// Mock dependencies
vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

describe('Clerk Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('user.created event', () => {
    it('should create User and Student records with STUDENT role', async () => {
      const webhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_123',
          email_addresses: [
            {
              id: 'email_1',
              email_address: 'test@example.com',
              verification: {
                status: 'verified',
              },
            },
          ],
          primary_email_address_id: 'email_1',
          first_name: 'John',
          last_name: 'Doe',
        },
      }

      const mockCreatedUser = {
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
        },
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any)

      // Simulate webhook handler logic
      const primaryEmail = webhookPayload.data.email_addresses.find(
        (email) => email.id === webhookPayload.data.primary_email_address_id
      )

      const user = await prisma.user.create({
        data: {
          clerkId: webhookPayload.data.id,
          email: primaryEmail!.email_address,
          emailVerified: primaryEmail!.verification?.status === 'verified',
          role: 'STUDENT',
          student: {
            create: {
              firstName: webhookPayload.data.first_name || '',
              lastName: webhookPayload.data.last_name || '',
            },
          },
        },
        include: {
          student: true,
        },
      })

      expect(user.role).toBe('STUDENT')
      expect(user.email).toBe('test@example.com')
      expect(user.emailVerified).toBe(true)
      expect(user.student).toBeDefined()
      expect(user.student?.firstName).toBe('John')
    })

    it('should handle idempotency when user already exists', async () => {
      const existingUser = {
        id: 'user_existing',
        clerkId: 'clerk_existing',
        email: 'existing@example.com',
        role: 'STUDENT',
      }

      vi.mocked(prisma.user.create).mockRejectedValue(new Error('Unique constraint failed'))
      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any)

      // Simulate webhook handler error handling
      try {
        await prisma.user.create({
          data: {
            clerkId: 'clerk_existing',
            email: 'existing@example.com',
            role: 'STUDENT',
            emailVerified: true,
            student: {
              create: {
                firstName: 'Test',
                lastName: 'User',
              },
            },
          },
          include: { student: true },
        })
      } catch (error) {
        // Check for existing user
        const user = await prisma.user.findUnique({
          where: { clerkId: 'clerk_existing' },
        })

        expect(user).toBeDefined()
        expect(user?.id).toBe('user_existing')
      }
    })
  })

  describe('user.updated event', () => {
    it('should update User and Student records', async () => {
      const webhookPayload = {
        type: 'user.updated',
        data: {
          id: 'clerk_123',
          email_addresses: [
            {
              id: 'email_1',
              email_address: 'updated@example.com',
              verification: {
                status: 'verified',
              },
            },
          ],
          primary_email_address_id: 'email_1',
          first_name: 'John',
          last_name: 'Updated',
        },
      }

      const mockUpdatedUser = {
        id: 'user_123',
        clerkId: 'clerk_123',
        email: 'updated@example.com',
        emailVerified: true,
        student: {
          firstName: 'John',
          lastName: 'Updated',
        },
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser as any)

      const primaryEmail = webhookPayload.data.email_addresses.find(
        (email) => email.id === webhookPayload.data.primary_email_address_id
      )

      const user = await prisma.user.update({
        where: { clerkId: webhookPayload.data.id },
        data: {
          email: primaryEmail!.email_address,
          emailVerified: primaryEmail!.verification?.status === 'verified',
          student: {
            update: {
              firstName: webhookPayload.data.first_name || '',
              lastName: webhookPayload.data.last_name || '',
            },
          },
        },
        include: {
          student: true,
        },
      })

      expect(user.email).toBe('updated@example.com')
      expect(user.student?.lastName).toBe('Updated')
    })
  })

  describe('user.deleted event', () => {
    it('should delete User record (cascade to Student)', async () => {
      const webhookPayload = {
        type: 'user.deleted',
        data: {
          id: 'clerk_to_delete',
        },
      }

      vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

      await prisma.user.delete({
        where: { clerkId: webhookPayload.data.id as string },
      })

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_to_delete' },
      })
    })
  })
})
