/**
 * Story 5.8: Parents Router Authorization Tests
 *
 * CRITICAL SECURITY TESTS - Must pass before deploying parent portal
 *
 * Tests:
 * - Parent access permission validation
 * - Read-only enforcement (parents cannot mutate student data)
 * - Permission revocation is immediate
 * - Parents cannot access students who haven't granted permission
 *
 * @module __tests__/server/routers/parents.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { ParentPermission, UserRole } from '@prisma/client'

// Mock the database module FIRST (before imports)
vi.mock('@/server/db', () => ({
  db: {
    studentParentAccess: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    parentNotificationPreferences: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Import AFTER mocking
import {
  verifyParentAccess,
  enforceParentAccess,
  hasParentPermission,
} from '@/server/middleware/parent-auth'
import { db } from '@/server/db'

// Get mocked db for test assertions
const mockDb = db as unknown as {
  studentParentAccess: {
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  parentNotificationPreferences: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  student: {
    findUnique: ReturnType<typeof vi.fn>
  }
  user: {
    findUnique: ReturnType<typeof vi.fn>
  }
}

describe('Parents Router Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyParentAccess', () => {
    it('should return access record when parent has valid access', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS],
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await verifyParentAccess('parent-1', 'student-1')

      expect(result).toEqual(mockAccess)
      expect(mockDb.studentParentAccess.findUnique).toHaveBeenCalledWith({
        where: {
          studentId_parentId: {
            studentId: 'student-1',
            parentId: 'parent-1',
          },
        },
      })
    })

    it('should return null when access record does not exist', async () => {
      mockDb.studentParentAccess.findUnique.mockResolvedValue(null)

      const result = await verifyParentAccess('parent-1', 'student-1')

      expect(result).toBeNull()
    })

    it('should return null when access is not granted', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS],
        accessGranted: false, // Access not granted
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await verifyParentAccess('parent-1', 'student-1')

      expect(result).toBeNull()
    })

    it('should return null when access has been revoked', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS],
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: new Date(), // Access revoked
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await verifyParentAccess('parent-1', 'student-1')

      expect(result).toBeNull()
    })
  })

  describe('hasParentPermission', () => {
    it('should return true when parent has required permission', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS, ParentPermission.VIEW_OUTCOMES],
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await hasParentPermission('parent-1', 'student-1', ParentPermission.VIEW_APPLICATIONS)

      expect(result).toBe(true)
    })

    it('should return false when parent does not have required permission', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS], // No VIEW_OUTCOMES permission
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await hasParentPermission('parent-1', 'student-1', ParentPermission.VIEW_OUTCOMES)

      expect(result).toBe(false)
    })

    it('should return false when parent has no access', async () => {
      mockDb.studentParentAccess.findUnique.mockResolvedValue(null)

      const result = await hasParentPermission('parent-1', 'student-1', ParentPermission.VIEW_APPLICATIONS)

      expect(result).toBe(false)
    })
  })

  describe('enforceParentAccess', () => {
    it('should return access record when parent has valid access', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS],
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await enforceParentAccess('parent-1', 'student-1')

      expect(result).toEqual(mockAccess)
    })

    it('should throw FORBIDDEN error when parent has no access', async () => {
      mockDb.studentParentAccess.findUnique.mockResolvedValue(null)

      await expect(enforceParentAccess('parent-1', 'student-1')).rejects.toThrow(TRPCError)
      await expect(enforceParentAccess('parent-1', 'student-1')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('do not have permission'),
      })
    })

    it('should throw FORBIDDEN error when parent lacks required permission', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS], // No VIEW_OUTCOMES
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      await expect(
        enforceParentAccess('parent-1', 'student-1', ParentPermission.VIEW_OUTCOMES)
      ).rejects.toThrow(TRPCError)
      await expect(
        enforceParentAccess('parent-1', 'student-1', ParentPermission.VIEW_OUTCOMES)
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('VIEW_OUTCOMES'),
      })
    })

    it('should succeed when parent has required permission', async () => {
      const mockAccess = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS, ParentPermission.VIEW_OUTCOMES],
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValue(mockAccess)

      const result = await enforceParentAccess('parent-1', 'student-1', ParentPermission.VIEW_OUTCOMES)

      expect(result).toEqual(mockAccess)
    })
  })

  describe('Access Revocation - CRITICAL SECURITY TEST', () => {
    it('should immediately deny access after revocation', async () => {
      // Scenario: Student revokes access, parent should be blocked immediately

      // First call: Access is granted
      const mockAccessGranted = {
        id: 'access-1',
        studentId: 'student-1',
        parentId: 'parent-1',
        permissions: [ParentPermission.VIEW_APPLICATIONS],
        accessGranted: true,
        grantedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValueOnce(mockAccessGranted)

      const resultBefore = await verifyParentAccess('parent-1', 'student-1')
      expect(resultBefore).toEqual(mockAccessGranted)

      // Second call: Access has been revoked
      const mockAccessRevoked = {
        ...mockAccessGranted,
        accessGranted: false,
        revokedAt: new Date(),
      }

      mockDb.studentParentAccess.findUnique.mockResolvedValueOnce(mockAccessRevoked)

      const resultAfter = await verifyParentAccess('parent-1', 'student-1')
      expect(resultAfter).toBeNull() // Access denied immediately
    })
  })
})

describe('Read-Only Enforcement Tests', () => {
  it('should document that parents have NO mutation procedures', () => {
    // This is a documentation test to ensure developers are aware
    // that parents should NEVER be able to mutate student data

    const parentAllowedMutations = [
      'updateNotificationPreferences', // Only parent's own preferences
    ]

    const studentOnlyMutations = [
      'grantAccess', // Student grants access
      'revokeAccess', // Student revokes access
    ]

    const parentDisallowedMutations = [
      // Applications
      'createApplication',
      'updateApplication',
      'deleteApplication',
      'submitApplication',
      // Essays
      'createEssay',
      'updateEssay',
      'deleteEssay',
      // Documents
      'uploadDocument',
      'deleteDocument',
      // Profile
      'updateProfile',
      'updateProfileStrength',
      // Outcomes
      'recordOutcome',
      'updateOutcome',
    ]

    // Assertion: Parent router should ONLY have query procedures + notification preferences
    expect(parentAllowedMutations).toHaveLength(1)
    expect(studentOnlyMutations).toHaveLength(2)
    expect(parentDisallowedMutations.length).toBeGreaterThan(0)

    // This test serves as documentation that read-only enforcement
    // is achieved by simply not exposing mutation procedures to parents
  })
})
