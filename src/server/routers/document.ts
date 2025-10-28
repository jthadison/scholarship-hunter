import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  supabaseAdmin,
  STORAGE_CONFIG,
  generateStoragePath,
  validateFileSize,
  validateMimeType,
  checkStorageQuota,
} from "../../lib/supabase";
import { DocumentType } from "@prisma/client";

/**
 * Document Router
 * Handles document upload, retrieval, preview, and storage management
 * Story 4.1: Document Vault - Storage & Organization
 */

export const documentRouter = router({
  /**
   * Upload document to Supabase Storage
   * AC1, AC4, AC7: File upload with validation and quota enforcement
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        applicationId: z.string().cuid().optional(),
        name: z.string().min(1, "Document name is required"),
        type: z.nativeEnum(DocumentType),
        fileName: z.string().min(1, "File name is required"),
        fileSize: z.number().int().positive(),
        mimeType: z.string(),
        fileData: z.string(), // Base64 encoded file data
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Validate file size
      const sizeValidation = validateFileSize(input.fileSize);
      if (!sizeValidation.valid) {
        throw new Error(sizeValidation.error);
      }

      // Validate MIME type
      const mimeValidation = validateMimeType(input.mimeType);
      if (!mimeValidation.valid) {
        throw new Error(mimeValidation.error);
      }

      // Check storage quota
      const currentUsage = await ctx.prisma.document.aggregate({
        where: { studentId: input.studentId },
        _sum: { fileSize: true },
      });

      const totalUsed = currentUsage._sum.fileSize ?? 0;
      const quotaCheck = await checkStorageQuota(
        input.studentId,
        totalUsed,
        input.fileSize
      );

      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.error);
      }

      // Generate storage path
      const storagePath = generateStoragePath(
        input.studentId,
        input.type,
        input.fileName
      );

      // Decode base64 file data
      const fileBuffer = Buffer.from(input.fileData, "base64");

      // Upload to Supabase Storage
      if (!supabaseAdmin) {
        throw new Error(
          "Supabase admin client not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env"
        );
      }

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: input.mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save document metadata to database
      const document = await ctx.prisma.document.create({
        data: {
          studentId: input.studentId,
          applicationId: input.applicationId,
          name: input.name,
          type: input.type,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          storagePath,
          bucketName: STORAGE_CONFIG.BUCKET_NAME,
          description: input.description,
          version: 1,
          compliant: false, // Will be validated in Story 4.3
        },
      });

      // Generate signed URL for immediate access
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .createSignedUrl(storagePath, STORAGE_CONFIG.SIGNED_URL_EXPIRY);

      return {
        document,
        signedUrl: signedUrlData?.signedUrl,
        percentageUsed: quotaCheck.percentageUsed,
      };
    }),

  /**
   * Get all documents for a student
   * AC2, AC3, AC6: List/filter documents with metadata
   */
  getAll: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        type: z.nativeEnum(DocumentType).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Build where clause
      const where: {
        studentId: string;
        type?: DocumentType;
        OR?: Array<{ name: { contains: string; mode: "insensitive" } }>;
      } = {
        studentId: input.studentId,
      };

      if (input.type) {
        where.type = input.type;
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const documents = await ctx.prisma.document.findMany({
        where,
        include: {
          application: {
            select: {
              id: true,
              scholarshipName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return documents;
    }),

  /**
   * Get single document by ID
   */
  getById: protectedProcedure
    .input(z.object({ documentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
        include: {
          student: true,
          application: {
            select: {
              id: true,
              scholarshipName: true,
            },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Verify user owns this student profile
      if (document.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this document");
      }

      return document;
    }),

  /**
   * Get signed URL for file preview/download
   * AC5: File preview with secure URLs
   */
  getPreviewUrl: protectedProcedure
    .input(z.object({ documentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
        include: { student: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Verify user owns this student profile
      if (document.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this document");
      }

      // Generate signed URL
      if (!supabaseAdmin) {
        throw new Error("Supabase admin client not configured");
      }

      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .createSignedUrl(document.storagePath, STORAGE_CONFIG.SIGNED_URL_EXPIRY);

      if (error) {
        throw new Error(`Failed to generate preview URL: ${error.message}`);
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + STORAGE_CONFIG.SIGNED_URL_EXPIRY * 1000),
        document,
      };
    }),

  /**
   * Get storage usage for student
   * AC7: Storage quota tracking
   */
  getStorageUsage: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      const aggregate = await ctx.prisma.document.aggregate({
        where: { studentId: input.studentId },
        _sum: { fileSize: true },
        _count: true,
      });

      const usedBytes = aggregate._sum.fileSize ?? 0;
      const quotaBytes = STORAGE_CONFIG.MAX_STORAGE_QUOTA;
      const percentageUsed = Math.round((usedBytes / quotaBytes) * 100);

      return {
        usedBytes,
        quotaBytes,
        percentageUsed,
        documentCount: aggregate._count,
        warningThreshold: percentageUsed >= 80,
      };
    }),

  /**
   * Update document metadata
   * AC3: Editable name and description
   */
  updateDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.string().cuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        applicationId: z.string().cuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
        include: { student: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Verify user owns this student profile
      if (document.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this document");
      }

      const updated = await ctx.prisma.document.update({
        where: { id: input.documentId },
        data: {
          name: input.name,
          description: input.description,
          applicationId: input.applicationId,
        },
      });

      return updated;
    }),

  /**
   * Delete document
   */
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
        include: { student: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Verify user owns this student profile
      if (document.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this document");
      }

      // Delete from Supabase Storage
      if (supabaseAdmin) {
        await supabaseAdmin.storage
          .from(STORAGE_CONFIG.BUCKET_NAME)
          .remove([document.storagePath]);
      }

      // Delete from database
      await ctx.prisma.document.delete({
        where: { id: input.documentId },
      });

      return { success: true };
    }),
});
