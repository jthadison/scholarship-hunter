/**
 * Story 5.8: Parent Authorization Middleware
 *
 * Middleware for validating parent access permissions and enforcing read-only access.
 * CRITICAL: All parent routes must use this middleware to enforce FERPA compliance.
 *
 * @module server/api/middleware/parent-auth
 */

import { TRPCError } from '@trpc/server'
import { db } from '@/server/db'
import type { ParentPermission } from '@prisma/client'

/**
 * Verify that a parent has access to a specific student
 *
 * @param parentUserId - Parent's user ID
 * @param studentId - Student ID to check access for
 * @returns StudentParentAccess record if access granted, null otherwise
 */
export async function verifyParentAccess(parentUserId: string, studentId: string) {
  const access = await db.studentParentAccess.findUnique({
    where: {
      studentId_parentId: {
        studentId,
        parentId: parentUserId,
      },
    },
  })

  // Access must exist and be granted (not revoked)
  if (!access || !access.accessGranted || access.revokedAt) {
    return null
  }

  return access
}

/**
 * Check if parent has a specific permission for a student
 *
 * @param parentUserId - Parent's user ID
 * @param studentId - Student ID
 * @param requiredPermission - Permission to check
 * @returns true if parent has permission, false otherwise
 */
export async function hasParentPermission(
  parentUserId: string,
  studentId: string,
  requiredPermission: ParentPermission
): Promise<boolean> {
  const access = await verifyParentAccess(parentUserId, studentId)

  if (!access) {
    return false
  }

  return access.permissions.includes(requiredPermission)
}

/**
 * Get all students a parent has access to
 *
 * @param parentUserId - Parent's user ID
 * @returns Array of student IDs with access details
 */
export async function getParentAccessibleStudents(parentUserId: string) {
  const accessRecords = await db.studentParentAccess.findMany({
    where: {
      parentId: parentUserId,
      accessGranted: true,
      revokedAt: null,
    },
    include: {
      // Note: We'll need to join with Student model once we add the relation
    },
  })

  return accessRecords
}

/**
 * Enforce parent access and permission for a student
 * Throws TRPCError if access denied
 *
 * @param parentUserId - Parent's user ID
 * @param studentId - Student ID
 * @param requiredPermission - Optional specific permission to check
 * @returns StudentParentAccess record
 */
export async function enforceParentAccess(
  parentUserId: string,
  studentId: string,
  requiredPermission?: ParentPermission
) {
  const access = await verifyParentAccess(parentUserId, studentId)

  if (!access) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this student\'s data',
    })
  }

  // Check specific permission if required
  if (requiredPermission && !access.permissions.includes(requiredPermission)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You do not have ${requiredPermission} permission for this student`,
    })
  }

  return access
}

/**
 * Audit log for parent access events
 * FERPA compliance requires logging all access to student data
 *
 * @param parentUserId - Parent's user ID
 * @param studentId - Student ID
 * @param action - Action performed (VIEW_DASHBOARD, VIEW_APPLICATION, etc.)
 * @param metadata - Optional additional context
 */
export async function auditParentAccess(
  parentUserId: string,
  studentId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  // TODO: Implement audit logging (Story 5.8 - can use EmailLog table or create dedicated ParentAccessLog)
  // For now, just log to console
  console.log('[PARENT_ACCESS_AUDIT]', {
    parentUserId,
    studentId,
    action,
    metadata,
    timestamp: new Date().toISOString(),
  })
}
