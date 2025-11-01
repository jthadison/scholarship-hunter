/**
 * Tests for Counselor Permission System
 * Story 5.6: Counselor Portal - Student Monitoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  verifyCounselorAccess,
  getCounselorByUserId,
  getStudentByUserId,
} from '@/lib/counselor/permissions'
import { prisma } from '@/server/db'

// Mock Prisma client
vi.mock('@/server/db', () => ({
  prisma: {
    studentCounselorPermission: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Counselor Permission System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyCounselorAccess', () => {
    it('should return true when active permission exists', async () => {
      // Mock active permission
      vi.mocked(prisma.studentCounselorPermission.findFirst).mockResolvedValue({
        id: 'perm-1',
        studentId: 'student-1',
        counselorId: 'counselor-1',
        status: 'ACTIVE',
        permissionLevel: 'VIEW_DETAILED',
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await verifyCounselorAccess('counselor-1', 'student-1')

      expect(result).toBe(true)
      expect(prisma.studentCounselorPermission.findFirst).toHaveBeenCalledWith({
        where: {
          counselorId: 'counselor-1',
          studentId: 'student-1',
          status: 'ACTIVE',
          revokedAt: null,
        },
      })
    })

    it('should return false when no permission exists', async () => {
      vi.mocked(prisma.studentCounselorPermission.findFirst).mockResolvedValue(null)

      const result = await verifyCounselorAccess('counselor-1', 'student-1')

      expect(result).toBe(false)
    })

    it('should return false when permission is revoked', async () => {
      vi.mocked(prisma.studentCounselorPermission.findFirst).mockResolvedValue(null)

      const result = await verifyCounselorAccess('counselor-1', 'student-1')

      expect(result).toBe(false)
    })

    it('should return false when permission is pending', async () => {
      vi.mocked(prisma.studentCounselorPermission.findFirst).mockResolvedValue(null)

      const result = await verifyCounselorAccess('counselor-1', 'student-1')

      expect(result).toBe(false)
    })
  })

  describe('getCounselorByUserId', () => {
    it('should return counselor when user is a counselor', async () => {
      const mockCounselor = {
        id: 'counselor-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@school.edu',
        schoolName: 'Lincoln High School',
        schoolDistrict: 'District 1',
        certificationNumber: 'CERT123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        clerkId: 'clerk-123',
        email: 'jane.smith@school.edu',
        emailVerified: true,
        role: 'COUNSELOR',
        createdAt: new Date(),
        updatedAt: new Date(),
        counselor: mockCounselor,
      } as any)

      const result = await getCounselorByUserId('clerk-123')

      expect(result).toEqual(mockCounselor)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' },
        include: { counselor: true },
      })
    })

    it('should throw error when user is not a counselor', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        clerkId: 'clerk-123',
        email: 'student@example.com',
        emailVerified: true,
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        counselor: null,
      } as any)

      await expect(getCounselorByUserId('clerk-123')).rejects.toThrow(
        'User is not a counselor'
      )
    })

    it('should throw error when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(getCounselorByUserId('clerk-123')).rejects.toThrow(
        'User is not a counselor'
      )
    })
  })

  describe('getStudentByUserId', () => {
    it('should return student when user is a student', async () => {
      const mockStudent = {
        id: 'student-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('2005-01-01'),
        phone: '555-1234',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        clerkId: 'clerk-456',
        email: 'john.doe@example.com',
        emailVerified: true,
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        student: mockStudent,
      } as any)

      const result = await getStudentByUserId('clerk-456')

      expect(result).toEqual(mockStudent)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-456' },
        include: { student: true },
      })
    })

    it('should throw error when user is not a student', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        clerkId: 'clerk-456',
        email: 'counselor@school.edu',
        emailVerified: true,
        role: 'COUNSELOR',
        createdAt: new Date(),
        updatedAt: new Date(),
        student: null,
      } as any)

      await expect(getStudentByUserId('clerk-456')).rejects.toThrow(
        'User is not a student'
      )
    })
  })
})
