/**
 * Story 3.4: Alert tRPC Router
 *
 * API endpoints for deadline alert system:
 * - getUnread: Fetch unread alerts for in-app notifications
 * - snooze: Snooze an alert for 24 hours
 * - dismiss: Dismiss an alert permanently
 *
 * @module server/routers/alert
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'
import { addHours } from 'date-fns'

export const alertRouter = router({
  /**
   * Get unread alerts
   *
   * Returns all unread alerts (PENDING or SNOOZED where snoozeUntil has passed)
   * for the authenticated student. Used by notification badge and panel.
   *
   * @returns Array of alerts with application and scholarship details
   */
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const student = await prisma.student.findUnique({
      where: { userId: ctx.userId },
    })

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student profile not found',
      })
    }

    const now = new Date()

    const alerts = await prisma.alert.findMany({
      where: {
        studentId: student.id,
        status: {
          in: ['PENDING', 'SNOOZED'],
        },
        OR: [
          { status: 'PENDING' },
          {
            status: 'SNOOZED',
            snoozeUntil: {
              lte: now,
            },
          },
        ],
      },
      include: {
        application: {
          include: {
            scholarship: {
              select: {
                id: true,
                name: true,
                awardAmount: true,
                deadline: true,
              },
            },
          },
        },
      },
      orderBy: [
        // Sort by alert type (most urgent first)
        { alertType: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return alerts
  }),

  /**
   * Snooze an alert
   *
   * Snoozes an alert for 24 hours. The alert will reappear after the snooze period.
   *
   * @input alertId - ID of alert to snooze
   * @returns Updated alert
   */
  snooze: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found',
        })
      }

      // Verify alert belongs to student
      const alert = await prisma.alert.findUnique({
        where: { id: input.alertId },
      })

      if (!alert || alert.studentId !== student.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alert not found',
        })
      }

      // Update alert to SNOOZED status with snoozeUntil = now + 24 hours
      return prisma.alert.update({
        where: { id: input.alertId },
        data: {
          status: 'SNOOZED',
          snoozeUntil: addHours(new Date(), 24),
        },
      })
    }),

  /**
   * Dismiss an alert
   *
   * Permanently dismisses an alert. The alert will not appear again.
   *
   * @input alertId - ID of alert to dismiss
   * @returns Updated alert
   */
  dismiss: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found',
        })
      }

      // Verify alert belongs to student
      const alert = await prisma.alert.findUnique({
        where: { id: input.alertId },
      })

      if (!alert || alert.studentId !== student.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alert not found',
        })
      }

      // Update alert to DISMISSED status
      return prisma.alert.update({
        where: { id: input.alertId },
        data: {
          status: 'DISMISSED',
        },
      })
    }),
})
