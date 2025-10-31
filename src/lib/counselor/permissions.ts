import { prisma } from '@/server/db'
import { TRPCError } from '@trpc/server'

/**
 * Verify counselor has active permission to access student data
 * @param counselorId - The counselor's ID
 * @param studentId - The student's ID
 * @returns true if permission is active, false otherwise
 */
export async function verifyCounselorAccess(
  counselorId: string,
  studentId: string
): Promise<boolean> {
  const permission = await prisma.studentCounselorPermission.findFirst({
    where: {
      counselorId,
      studentId,
      status: 'ACTIVE',
      revokedAt: null,
    },
  })

  return !!permission
}

/**
 * Get counselor by user ID, throwing error if not found
 * @param userId - The user's Clerk ID
 * @returns Counselor record
 */
export async function getCounselorByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { counselor: true },
  })

  if (!user?.counselor) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User is not a counselor',
    })
  }

  return user.counselor
}

/**
 * Get student by user ID, throwing error if not found
 * @param userId - The user's Clerk ID
 * @returns Student record
 */
export async function getStudentByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { student: true },
  })

  if (!user?.student) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User is not a student',
    })
  }

  return user.student
}

/**
 * Log counselor access event for audit trail
 * @param counselorId - The counselor's ID
 * @param studentId - The student's ID
 * @param action - The action performed
 */
export async function logCounselorAccess(
  counselorId: string,
  studentId: string,
  action: string
) {
  // TODO: Implement audit logging when EmailLog or dedicated AuditLog model is available
  // For now, this is a placeholder for future FERPA compliance logging
  console.log(`AUDIT: Counselor ${counselorId} performed ${action} on student ${studentId}`)
}
