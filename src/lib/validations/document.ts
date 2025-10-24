import { z } from "zod";

/**
 * Document Validation Schemas
 * Validates document metadata including storage, version control, and compliance
 */

// Document Type Enum
const documentTypeEnum = z.enum([
  "TRANSCRIPT",
  "RESUME",
  "PERSONAL_STATEMENT",
  "FINANCIAL_DOCUMENT",
  "RECOMMENDATION_LETTER",
  "SUPPLEMENTAL_MATERIAL",
  "OTHER",
]);

// Allowed MIME types for documents
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
];

export const documentCreateSchema = z.object({
  studentId: z.string().cuid(),
  applicationId: z.string().cuid().optional(),

  // Document Metadata
  name: z.string().min(1, "Document name is required"),
  type: documentTypeEnum,
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  mimeType: z.string().refine(
    (mime) => allowedMimeTypes.includes(mime),
    {
      message: `MIME type must be one of: ${allowedMimeTypes.join(", ")}`,
    }
  ),

  // Storage
  storagePath: z.string().min(1, "Storage path is required"),
  bucketName: z.string().default("documents"),

  // Version Control
  version: z.number().int().positive().default(1),
  previousVersionId: z.string().cuid().optional(),

  // Compliance Validation
  compliant: z.boolean().default(false),
  validationErrors: z.any().optional(), // JSON object with validation error details
}).refine(
  (data) => {
    // File size limit: 10MB = 10 * 1024 * 1024 bytes
    const maxFileSize = 10 * 1024 * 1024;
    return data.fileSize <= maxFileSize;
  },
  {
    message: "File size must not exceed 10MB",
    path: ["fileSize"],
  }
).refine(
  (data) => {
    // If not compliant, validation errors should be provided
    if (!data.compliant && !data.validationErrors) {
      return false;
    }
    return true;
  },
  {
    message: "Validation errors must be provided if document is not compliant",
    path: ["validationErrors"],
  }
);

// Base schema without refinements for updates
const documentBaseSchema = z.object({
  studentId: z.string().cuid(),
  applicationId: z.string().cuid().optional(),

  // Document Metadata
  name: z.string().min(1, "Document name is required"),
  type: documentTypeEnum,
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  mimeType: z.string().refine(
    (mime) => allowedMimeTypes.includes(mime),
    {
      message: `MIME type must be one of: ${allowedMimeTypes.join(", ")}`,
    }
  ),

  // Storage
  storagePath: z.string().min(1, "Storage path is required"),
  bucketName: z.string().default("documents"),

  // Version Control
  version: z.number().int().positive().default(1),
  previousVersionId: z.string().cuid().optional(),

  // Compliance Validation
  compliant: z.boolean().default(false),
  validationErrors: z.any().optional(), // JSON object with validation error details
});

export const documentUpdateSchema = documentBaseSchema.partial().omit({
  studentId: true,
});

// Document Filter Schema
export const documentFilterSchema = z.object({
  studentId: z.string().cuid().optional(),
  applicationId: z.string().cuid().optional(),
  type: documentTypeEnum.optional(),
  compliant: z.boolean().optional(),
  bucketName: z.string().optional(),
});

// Recommendation Create Schema
export const recommendationCreateSchema = z.object({
  applicationId: z.string().cuid(),

  // Recommender Info
  name: z.string().min(1, "Recommender name is required"),
  email: z.string().email("Valid email is required"),
  relationship: z.string().min(1, "Relationship is required"),

  // Tracking
  status: z.enum([
    "PENDING_REQUEST",
    "REQUESTED",
    "REMINDED",
    "RECEIVED",
    "SUBMITTED",
  ]).default("PENDING_REQUEST"),
  requestedAt: z.coerce.date().optional(),
  reminderSentAt: z.coerce.date().optional(),
  receivedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),

  // Upload Token
  uploadToken: z.string().min(32, "Upload token must be at least 32 characters"),
  uploadLinkExpiry: z.coerce.date().optional(),

  // Document Reference
  documentId: z.string().cuid().optional(),
}).refine(
  (data) => {
    // If upload link expiry is provided, it must be in the future
    if (data.uploadLinkExpiry !== undefined) {
      return data.uploadLinkExpiry > new Date();
    }
    return true;
  },
  {
    message: "Upload link expiry must be in the future",
    path: ["uploadLinkExpiry"],
  }
);

// Base recommendation schema without refinements
const recommendationBaseSchema = z.object({
  applicationId: z.string().cuid(),

  // Recommender Info
  name: z.string().min(1, "Recommender name is required"),
  email: z.string().email("Valid email is required"),
  relationship: z.string().min(1, "Relationship is required"),

  // Tracking
  status: z.enum([
    "PENDING_REQUEST",
    "REQUESTED",
    "REMINDED",
    "RECEIVED",
    "SUBMITTED",
  ]).default("PENDING_REQUEST"),
  requestedAt: z.coerce.date().optional(),
  reminderSentAt: z.coerce.date().optional(),
  receivedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),

  // Upload Token
  uploadToken: z.string().min(32, "Upload token must be at least 32 characters"),
  uploadLinkExpiry: z.coerce.date().optional(),

  // Document Reference
  documentId: z.string().cuid().optional(),
});

export const recommendationUpdateSchema = recommendationBaseSchema.partial().omit({
  applicationId: true,
  uploadToken: true, // Cannot update upload token after creation
});

// Type exports
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
export type RecommendationCreateInput = z.infer<typeof recommendationCreateSchema>;
export type RecommendationUpdateInput = z.infer<typeof recommendationUpdateSchema>;
