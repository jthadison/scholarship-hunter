import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  recommendationRequestSchema,
  recommendationUploadSchema,
} from "../../lib/validations/document";
import {
  generateUploadToken,
  validateUploadToken,
  calculateTokenExpiry,
  checkDuplicateRecommender,
  countRecommendations,
} from "../../lib/recommendation/tokenUtils";
import {
  sendRecommendationRequest,
  sendRecommendationReminder,
  sendRecommendationConfirmation,
  notifyStudentRecommendationReceived,
} from "../services/emailService";
import { DocumentType } from "@prisma/client";

/**
 * Recommendation Router
 * Handles recommendation letter coordination, tracking, and upload
 * Story 4.4: Recommendation Letter Coordination
 */

const MAX_RECOMMENDATIONS_PER_APPLICATION = 5;
const MAX_REMINDERS_PER_RECOMMENDATION = 2;

export const recommendationRouter = router({
  /**
   * Create a recommendation request and send email
   * AC1, AC2: Request form and templated email generation
   */
  create: protectedProcedure
    .input(recommendationRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this application
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.applicationId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          scholarship: true,
        },
      });

      if (!application || application.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this application");
      }

      // AC7: Check duplicate recommender
      const isDuplicate = await checkDuplicateRecommender(
        input.applicationId,
        input.recommenderEmail
      );

      if (isDuplicate) {
        throw new Error(
          "You have already requested a recommendation from this email address for this application"
        );
      }

      // AC7: Check max recommendations limit
      const currentCount = await countRecommendations(input.applicationId);
      if (currentCount >= MAX_RECOMMENDATIONS_PER_APPLICATION) {
        throw new Error(
          `Maximum ${MAX_RECOMMENDATIONS_PER_APPLICATION} recommendations per application`
        );
      }

      // Generate secure upload token
      const uploadToken = generateUploadToken();
      const uploadLinkExpiry = calculateTokenExpiry();

      // Create recommendation record
      const recommendation = await ctx.prisma.recommendation.create({
        data: {
          applicationId: input.applicationId,
          recommenderName: input.recommenderName,
          recommenderEmail: input.recommenderEmail,
          relationship: input.relationship,
          personalMessage: input.personalMessage,
          uploadToken,
          uploadLinkExpiry,
          status: "PENDING_REQUEST",
        },
      });

      // AC2: Generate upload link
      const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/upload-rec/${uploadToken}`;

      // AC2: Send recommendation request email
      try {
        await sendRecommendationRequest({
          studentName: `${application.student.firstName} ${application.student.lastName}`,
          studentEmail: application.student.user.email,
          studentPhone: application.student.phone || undefined,
          recommenderName: input.recommenderName,
          recommenderEmail: input.recommenderEmail,
          scholarshipName: application.scholarship.name,
          deadline: application.scholarship.deadline,
          uploadLink,
          personalMessage: input.personalMessage,
        });

        // Update status to REQUESTED after successful email send
        await ctx.prisma.recommendation.update({
          where: { id: recommendation.id },
          data: {
            status: "REQUESTED",
            requestedAt: new Date(),
          },
        });

        // Update application recommendation count
        await ctx.prisma.application.update({
          where: { id: input.applicationId },
          data: {
            recsRequired: Math.max(
              application.recsRequired,
              currentCount + 1
            ),
          },
        });
      } catch (error) {
        // If email fails, delete the recommendation record
        await ctx.prisma.recommendation.delete({
          where: { id: recommendation.id },
        });
        throw new Error("Failed to send recommendation request email");
      }

      return recommendation;
    }),

  /**
   * Send manual reminder to recommender
   * AC5: Manual follow-up option
   */
  sendManualReminder: protectedProcedure
    .input(z.object({ recommendationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const recommendation = await ctx.prisma.recommendation.findUnique({
        where: { id: input.recommendationId },
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
              scholarship: true,
            },
          },
        },
      });

      if (!recommendation) {
        throw new Error("Recommendation not found");
      }

      // Verify user owns this application
      if (recommendation.application.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this application");
      }

      // Check if already received
      if (recommendation.status === "RECEIVED" || recommendation.status === "SUBMITTED") {
        throw new Error("This recommendation has already been received");
      }

      // AC5: Rate limiting - max 2 reminders
      if (recommendation.reminderCount >= MAX_REMINDERS_PER_RECOMMENDATION) {
        throw new Error(
          `Maximum ${MAX_REMINDERS_PER_RECOMMENDATION} reminders per recommendation reached`
        );
      }

      // Calculate days until deadline
      const daysUntilDue = Math.ceil(
        (recommendation.application.scholarship.deadline.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      // Generate upload link
      const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/upload-rec/${recommendation.uploadToken}`;

      // Send reminder email
      await sendRecommendationReminder({
        studentName: `${recommendation.application.student.firstName} ${recommendation.application.student.lastName}`,
        recommenderName: recommendation.recommenderName,
        recommenderEmail: recommendation.recommenderEmail,
        scholarshipName: recommendation.application.scholarship.name,
        deadline: recommendation.application.scholarship.deadline,
        uploadLink,
        daysUntilDue,
      });

      // Update recommendation status and reminder count
      const updated = await ctx.prisma.recommendation.update({
        where: { id: input.recommendationId },
        data: {
          status: "REMINDED",
          reminderSentAt: new Date(),
          reminderCount: {
            increment: 1,
          },
        },
      });

      return updated;
    }),

  /**
   * Get all recommendations for an application
   * AC3, AC7: Request tracking table with multiple recommendations
   */
  getByApplication: protectedProcedure
    .input(z.object({ applicationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this application
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.applicationId },
        include: {
          student: true,
        },
      });

      if (!application || application.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this application");
      }

      const recommendations = await ctx.prisma.recommendation.findMany({
        where: { applicationId: input.applicationId },
        include: {
          document: {
            select: {
              id: true,
              name: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              storagePath: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return recommendations;
    }),

  /**
   * Get single recommendation details
   * AC3: Recommendation detail view
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const recommendation = await ctx.prisma.recommendation.findUnique({
        where: { id: input.id },
        include: {
          application: {
            include: {
              student: true,
              scholarship: {
                select: {
                  name: true,
                  deadline: true,
                },
              },
            },
          },
          document: true,
        },
      });

      if (!recommendation) {
        throw new Error("Recommendation not found");
      }

      // Verify user owns this application
      if (recommendation.application.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this application");
      }

      return recommendation;
    }),

  /**
   * Upload recommendation letter via public token
   * AC6: Recommender upload link → student sees "Received" status
   */
  uploadByToken: publicProcedure
    .input(recommendationUploadSchema)
    .mutation(async ({ ctx, input }) => {
      // AC6: Validate upload token
      const recommendation = await validateUploadToken(input.token);

      // Create Document record for the recommendation letter
      const document = await ctx.prisma.document.create({
        data: {
          studentId: recommendation.application.studentId,
          applicationId: recommendation.applicationId,
          name: `Recommendation from ${recommendation.recommenderName}`,
          type: DocumentType.RECOMMENDATION_LETTER,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          storagePath: input.fileUrl, // File already uploaded to Supabase Storage
          bucketName: "documents",
          compliant: true, // Recommendation letters are auto-compliant
        },
      });

      // AC6: Update recommendation status to RECEIVED
      const updated = await ctx.prisma.recommendation.update({
        where: { id: recommendation.id },
        data: {
          status: "RECEIVED",
          receivedAt: new Date(),
          documentId: document.id,
        },
      });

      // Update application recommendation count
      const application = await ctx.prisma.application.findUnique({
        where: { id: recommendation.applicationId },
      });

      if (application) {
        await ctx.prisma.application.update({
          where: { id: recommendation.applicationId },
          data: {
            recsReceived: application.recsReceived + 1,
          },
        });
      }

      // AC6: Send confirmation email to recommender
      await sendRecommendationConfirmation({
        recommenderName: recommendation.recommenderName,
        recommenderEmail: recommendation.recommenderEmail,
        studentName: `${recommendation.application.student.firstName} ${recommendation.application.student.lastName}`,
        scholarshipName: recommendation.application.scholarship.name,
      });

      // AC6: Notify student
      await notifyStudentRecommendationReceived({
        studentEmail: recommendation.application.student.user.email,
        studentName: `${recommendation.application.student.firstName} ${recommendation.application.student.lastName}`,
        recommenderName: recommendation.recommenderName,
        scholarshipName: recommendation.application.scholarship.name,
      });

      return {
        success: true,
        recommendation: updated,
      };
    }),

  /**
   * Delete a recommendation request
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const recommendation = await ctx.prisma.recommendation.findUnique({
        where: { id: input.id },
        include: {
          application: {
            include: {
              student: true,
            },
          },
        },
      });

      if (!recommendation) {
        throw new Error("Recommendation not found");
      }

      // Verify user owns this application
      if (recommendation.application.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this application");
      }

      // Don't allow deletion if already received
      if (recommendation.status === "RECEIVED" || recommendation.status === "SUBMITTED") {
        throw new Error("Cannot delete a received recommendation");
      }

      await ctx.prisma.recommendation.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get recommendations summary for dashboard
   * AC3: Dashboard overview
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.prisma.student.findUnique({
      where: { userId: ctx.userId },
    });

    if (!student) {
      throw new Error("Student profile not found");
    }

    const recommendations = await ctx.prisma.recommendation.findMany({
      where: {
        application: {
          studentId: student.id,
        },
      },
      include: {
        application: {
          include: {
            scholarship: {
              select: {
                name: true,
                deadline: true,
              },
            },
          },
        },
      },
    });

    const summary = {
      total: recommendations.length,
      pending: recommendations.filter((r) => r.status === "PENDING_REQUEST" || r.status === "REQUESTED").length,
      reminded: recommendations.filter((r) => r.status === "REMINDED").length,
      received: recommendations.filter((r) => r.status === "RECEIVED").length,
      overdue: recommendations.filter(
        (r) =>
          (r.status === "REQUESTED" || r.status === "REMINDED") &&
          r.application.scholarship.deadline < new Date()
      ).length,
    };

    return summary;
  }),
});
