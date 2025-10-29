import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  getSupabaseAdmin,
  STORAGE_CONFIG,
  generateStoragePath,
  validateFileSize,
  validateMimeType,
  checkStorageQuota,
} from "../../lib/supabase";
import { DocumentType } from "@prisma/client";
import {
  findCurrentVersion,
  getNextVersionNumber,
  getVersionHistory,
  isCurrentVersion,
} from "../../lib/document/versionUtils";

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
        versionNote: z.string().optional(), // Story 4.2: Version notes
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

      // Story 4.2: Check for existing document to handle versioning
      const existingDocument = await findCurrentVersion(
        input.studentId,
        input.name,
        input.type
      );

      let versionNumber = 1;
      let previousVersionId: string | undefined;

      if (existingDocument) {
        // Document exists, create new version
        versionNumber = existingDocument.version + 1;
        previousVersionId = existingDocument.id;
      }

      // Generate versioned storage path
      const fileNameWithoutExt = input.fileName.replace(/\.[^/.]+$/, "");
      const fileExt = input.fileName.match(/\.[^/.]+$/)?.[0] ?? "";
      const versionedFileName = `${fileNameWithoutExt}_v${versionNumber}${fileExt}`;

      const storagePath = generateStoragePath(
        input.studentId,
        input.type,
        versionedFileName
      );

      // Decode base64 file data
      const fileBuffer = Buffer.from(input.fileData, "base64");

      // Upload to Supabase Storage
      const supabaseAdmin = getSupabaseAdmin();
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
          version: versionNumber,
          previousVersionId,
          versionNote: input.versionNote,
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
              scholarship: { select: { name: true } },
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
              scholarship: { select: { name: true } },
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
      const supabaseAdmin = getSupabaseAdmin();
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
      const supabaseAdmin = getSupabaseAdmin();
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

  /**
   * Story 4.2: Get version history for a document
   * AC2: Version History Display
   */
  getVersionHistory: protectedProcedure
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

      // Get all versions in the chain
      const versions = await getVersionHistory(input.documentId);

      // Check which is current version
      const versionsWithStatus = await Promise.all(
        versions.map(async (v) => ({
          ...v,
          isCurrent: await isCurrentVersion(v.id),
        }))
      );

      return versionsWithStatus;
    }),

  /**
   * Story 4.2: Get specific version by ID
   * AC3: View and Download Previous Versions
   */
  getVersionById: protectedProcedure
    .input(z.object({ versionId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.versionId },
        include: { student: true },
      });

      if (!document) {
        throw new Error("Version not found");
      }

      // Verify user owns this student profile
      if (document.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this document");
      }

      // Generate signed URL for this version
      const supabaseAdmin = getSupabaseAdmin();
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
        document,
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + STORAGE_CONFIG.SIGNED_URL_EXPIRY * 1000),
        isCurrent: await isCurrentVersion(document.id),
      };
    }),

  /**
   * Story 4.2: Restore a previous version
   * AC6: Rollback Functionality
   */
  restoreVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.string().cuid(),
        versionNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetVersion = await ctx.prisma.document.findUnique({
        where: { id: input.versionId },
        include: { student: true },
      });

      if (!targetVersion) {
        throw new Error("Version not found");
      }

      // Verify user owns this student profile
      if (targetVersion.student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this document");
      }

      // Find current version
      const currentVersion = await findCurrentVersion(
        targetVersion.studentId,
        targetVersion.name,
        targetVersion.type
      );

      if (!currentVersion) {
        throw new Error("Current version not found");
      }

      // Get file from storage
      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error("Supabase admin client not configured");
      }

      // Download the target version's file
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .download(targetVersion.storagePath);

      if (downloadError || !fileData) {
        throw new Error(
          `Failed to download version file: ${downloadError?.message ?? "File not found"}`
        );
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Create new version number
      const newVersionNumber = currentVersion.version + 1;

      // Generate new versioned storage path
      const fileNameWithoutExt = targetVersion.fileName.replace(/\.[^/.]+$/, "");
      const fileExt = targetVersion.fileName.match(/\.[^/.]+$/)?.[0] ?? "";
      const versionedFileName = `${fileNameWithoutExt}_v${newVersionNumber}${fileExt}`;

      const newStoragePath = generateStoragePath(
        targetVersion.studentId,
        targetVersion.type,
        versionedFileName
      );

      // Upload restored content as new version
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .upload(newStoragePath, fileBuffer, {
          contentType: targetVersion.mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload restored version: ${uploadError.message}`);
      }

      // Create new document record with restored content
      const restoredDocument = await ctx.prisma.document.create({
        data: {
          studentId: targetVersion.studentId,
          applicationId: targetVersion.applicationId,
          name: targetVersion.name,
          type: targetVersion.type,
          fileName: targetVersion.fileName,
          fileSize: targetVersion.fileSize,
          mimeType: targetVersion.mimeType,
          storagePath: newStoragePath,
          bucketName: STORAGE_CONFIG.BUCKET_NAME,
          description: targetVersion.description,
          version: newVersionNumber,
          previousVersionId: currentVersion.id,
          versionNote: input.versionNote ?? `Restored from version ${targetVersion.version}`,
          compliant: targetVersion.compliant,
        },
      });

      return {
        document: restoredDocument,
        restoredFromVersion: targetVersion.version,
        newVersion: newVersionNumber,
      };
    }),

  /**
   * Story 4.2: Update version note
   * AC7: Version Notes
   */
  updateVersionNote: protectedProcedure
    .input(
      z.object({
        documentId: z.string().cuid(),
        versionNote: z.string().nullable(),
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
          versionNote: input.versionNote,
        },
      });

      return updated;
    }),
});
