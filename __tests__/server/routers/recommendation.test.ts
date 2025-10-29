/**
 * Recommendation Router Tests
 * Story 4.4: Recommendation Letter Coordination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { appRouter } from '@/server/routers/_app'
import { prisma } from '@/server/db'
import type { PrismaClient } from '@prisma/client'

// Mock email service
vi.mock('@/server/services/emailService', () => ({
  sendRecommendationRequest: vi.fn().mockResolvedValue(undefined),
  sendRecommendationReminder: vi.fn().mockResolvedValue(undefined),
  sendRecommendationConfirmation: vi.fn().mockResolvedValue(undefined),
  notifyStudentRecommendationReceived: vi.fn().mockResolvedValue(undefined),
}))

// Mock token utils
vi.mock('@/lib/recommendation/tokenUtils', () => ({
  generateUploadToken: vi.fn(() => 'a'.repeat(64)),
  validateUploadToken: vi.fn(),
  calculateTokenExpiry: vi.fn(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  checkDuplicateRecommender: vi.fn(() => Promise.resolve(false)),
  countRecommendations: vi.fn(() => Promise.resolve(0)),
}))

describe('Recommendation Router', () => {
  // Use valid CUID format IDs
  const mockUserId = 'clwxyz1234567890abcd'
  const mockStudentId = 'clwxyz1234567890abce'
  const mockApplicationId = 'clwxyz1234567890abcf'
  const mockScholarshipId = 'clwxyz1234567890abcg'
  const mockRecId = 'clwxyz1234567890abch'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create recommendation and send email', async () => {
      // Mock prisma calls
      const mockApplication = {
        id: mockApplicationId,
        studentId: mockStudentId,
        student: {
          id: mockStudentId,
          userId: mockUserId,
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-1234',
          user: { email: 'john@example.com' },
        },
        scholarship: {
          name: 'Test Scholarship',
          deadline: new Date('2025-12-31'),
        },
        recsRequired: 0,
      }

      const mockRecommendation = {
        id: mockRecId,
        applicationId: mockApplicationId,
        recommenderName: 'Dr. Smith',
        recommenderEmail: 'smith@example.com',
        relationship: 'Teacher',
        personalMessage: 'Please help!',
        uploadToken: 'a'.repeat(64),
        status: 'REQUESTED',
        requestedAt: new Date(),
      }

      vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(mockApplication as any)
      vi.spyOn(prisma.recommendation, 'create').mockResolvedValue(mockRecommendation as any)
      vi.spyOn(prisma.recommendation, 'update').mockResolvedValue({
        ...mockRecommendation,
        status: 'REQUESTED',
      } as any)
      vi.spyOn(prisma.application, 'update').mockResolvedValue(mockApplication as any)

      const caller = appRouter.createCaller({
        prisma: prisma as unknown as PrismaClient,
        userId: mockUserId,
        clerkId: 'clerk_123',
      })

      const result = await caller.recommendation.create({
        applicationId: mockApplicationId,
        recommenderName: 'Dr. Smith',
        recommenderEmail: 'smith@example.com',
        relationship: 'Teacher',
        personalMessage: 'Please help!',
      })

      expect(result).toBeDefined()
      expect(prisma.recommendation.create).toHaveBeenCalled()
      expect(prisma.recommendation.update).toHaveBeenCalled()
    })

    it('should reject unauthorized user', async () => {
      const mockApplication = {
        id: mockApplicationId,
        studentId: mockStudentId,
        student: {
          userId: 'different_user',
        },
      }

      vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(mockApplication as any)

      const caller = appRouter.createCaller({
        prisma: prisma as unknown as PrismaClient,
        userId: mockUserId,
        clerkId: 'clerk_123',
      })

      await expect(
        caller.recommendation.create({
          applicationId: mockApplicationId,
          recommenderName: 'Dr. Smith',
          recommenderEmail: 'smith@example.com',
          relationship: 'Teacher',
        })
      ).rejects.toThrow('Unauthorized')
    })
  })

  describe('getByApplication', () => {
    it('should return recommendations for application', async () => {
      const mockApplication = {
        id: mockApplicationId,
        studentId: mockStudentId,
        student: { userId: mockUserId },
      }

      const mockRecommendations = [
        {
          id: mockRecId,
          recommenderName: 'Dr. Smith',
          recommenderEmail: 'smith@example.com',
          status: 'REQUESTED',
          document: null,
        },
      ]

      vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(mockApplication as any)
      vi.spyOn(prisma.recommendation, 'findMany').mockResolvedValue(mockRecommendations as any)

      const caller = appRouter.createCaller({
        prisma: prisma as unknown as PrismaClient,
        userId: mockUserId,
        clerkId: 'clerk_123',
      })

      const result = await caller.recommendation.getByApplication({
        applicationId: mockApplicationId,
      })

      expect(result).toHaveLength(1)
      expect(result[0].recommenderName).toBe('Dr. Smith')
    })
  })

  describe('sendManualReminder', () => {
    it('should send manual reminder', async () => {
      const mockRecommendation = {
        id: mockRecId,
        applicationId: mockApplicationId,
        recommenderName: 'Dr. Smith',
        recommenderEmail: 'smith@example.com',
        status: 'REQUESTED',
        reminderCount: 0,
        application: {
          student: {
            userId: mockUserId,
            firstName: 'John',
            lastName: 'Doe',
            user: { email: 'john@example.com' },
          },
          scholarship: {
            name: 'Test Scholarship',
            deadline: new Date('2025-12-31'),
          },
        },
        uploadToken: 'a'.repeat(64),
      }

      const mockUpdated = {
        ...mockRecommendation,
        status: 'REMINDED',
        reminderCount: 1,
        reminderSentAt: new Date(),
      }

      vi.spyOn(prisma.recommendation, 'findUnique').mockResolvedValue(mockRecommendation as any)
      vi.spyOn(prisma.recommendation, 'update').mockResolvedValue(mockUpdated as any)

      const caller = appRouter.createCaller({
        prisma: prisma as unknown as PrismaClient,
        userId: mockUserId,
        clerkId: 'clerk_123',
      })

      const result = await caller.recommendation.sendManualReminder({
        recommendationId: mockRecId,
      })

      expect(result.status).toBe('REMINDED')
      expect(result.reminderCount).toBe(1)
    })

    it('should enforce max reminder limit', async () => {
      const mockRecommendation = {
        id: mockRecId,
        applicationId: mockApplicationId,
        reminderCount: 2,
        status: 'REMINDED',
        application: {
          student: { userId: mockUserId },
        },
      }

      vi.spyOn(prisma.recommendation, 'findUnique').mockResolvedValue(mockRecommendation as any)

      const caller = appRouter.createCaller({
        prisma: prisma as unknown as PrismaClient,
        userId: mockUserId,
        clerkId: 'clerk_123',
      })

      await expect(
        caller.recommendation.sendManualReminder({
          recommendationId: mockRecId,
        })
      ).rejects.toThrow('Maximum')
    })
  })

  describe('getSummary', () => {
    it('should return recommendation summary', async () => {
      const mockStudent = { id: mockStudentId, userId: mockUserId }
      const mockRecommendations = [
        {
          id: 'clwxyz1234567890abc1',
          status: 'REQUESTED',
          application: { scholarship: { deadline: new Date('2025-12-31') } },
        },
        {
          id: 'clwxyz1234567890abc2',
          status: 'RECEIVED',
          application: { scholarship: { deadline: new Date('2025-12-31') } },
        },
      ]

      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent as any)
      vi.spyOn(prisma.recommendation, 'findMany').mockResolvedValue(mockRecommendations as any)

      const caller = appRouter.createCaller({
        prisma: prisma as unknown as PrismaClient,
        userId: mockUserId,
        clerkId: 'clerk_123',
      })

      const result = await caller.recommendation.getSummary()

      expect(result.total).toBe(2)
      expect(result.pending).toBe(1)
      expect(result.received).toBe(1)
    })
  })
})
