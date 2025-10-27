/**
 * Notification tRPC Router
 *
 * API endpoints for in-app notification system:
 * - getUnread: Fetch unread notification count (for badge)
 * - getRecent: Fetch recent notifications (for dropdown)
 * - getHistory: Fetch paginated notification history
 * - markAsRead: Mark notification(s) as read
 * - markAllAsRead: Mark all notifications as read
 *
 * @module server/routers/notification
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { prisma } from '../db'
import { TRPCError } from '@trpc/server'

export const notificationRouter = router({
  /**
   * Get unread notification count
   *
   * Returns count of unread notifications for the authenticated student.
   * Used by notification badge in header.
   *
   * @returns { count: number }
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

    const count = await prisma.notification.count({
      where: {
        studentId: student.id,
        read: false,
      },
    })

    return { count }
  }),

  /**
   * Get recent notifications
   *
   * Returns the 10 most recent notifications for the authenticated student.
   * Used by notification dropdown in header.
   *
   * @input limit - Optional limit (default: 10, max: 50)
   * @returns Array of notifications with scholarship details
   */
  getRecent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).optional().default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found',
        })
      }

      const notifications = await prisma.notification.findMany({
        where: {
          studentId: student.id,
        },
        include: {
          scholarship: {
            select: {
              id: true,
              name: true,
              provider: true,
              awardAmount: true,
              awardAmountMax: true,
              deadline: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input?.limit ?? 10,
      })

      return notifications
    }),

  /**
   * Get notification history with pagination
   *
   * Returns paginated notification history for the authenticated student.
   * Used by /notifications history page.
   *
   * @input page - Page number (1-indexed)
   * @input limit - Items per page (default: 20, max: 100)
   * @input filter - Optional filter: 'all' | 'unread' | 'read'
   * @returns { notifications: Notification[], total: number, pages: number }
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        filter: z.enum(['all', 'unread', 'read']).optional().default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found',
        })
      }

      const { page, limit, filter } = input
      const skip = (page - 1) * limit

      // Build where clause based on filter
      const where = {
        studentId: student.id,
        ...(filter === 'unread' && { read: false }),
        ...(filter === 'read' && { read: true }),
      }

      // Fetch notifications and total count in parallel
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            scholarship: {
              select: {
                id: true,
                name: true,
                provider: true,
                description: true,
                awardAmount: true,
                awardAmountMax: true,
                deadline: true,
                website: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ])

      return {
        notifications,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    }),

  /**
   * Mark notification as read
   *
   * Marks a single notification as read by ID.
   *
   * @input notificationId - ID of notification to mark as read
   * @returns Updated notification
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
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

      // Verify notification belongs to student
      const notification = await prisma.notification.findUnique({
        where: { id: input.notificationId },
      })

      if (!notification || notification.studentId !== student.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        })
      }

      return prisma.notification.update({
        where: { id: input.notificationId },
        data: { read: true },
      })
    }),

  /**
   * Mark all notifications as read
   *
   * Marks all unread notifications as read for the authenticated student.
   *
   * @returns Count of notifications marked as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const student = await prisma.student.findUnique({
      where: { userId: ctx.userId },
    })

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student profile not found',
      })
    }

    const result = await prisma.notification.updateMany({
      where: {
        studentId: student.id,
        read: false,
      },
      data: {
        read: true,
      },
    })

    return { count: result.count }
  }),
})
