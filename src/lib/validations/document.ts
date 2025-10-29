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

// Recommendation relationship enum
const relationshipEnum = z.enum([
  "Teacher",
  "Counselor",
  "Coach",
  "Employer",
  "Mentor",
  "Other",
]);

// Recommendation status enum
const recommendationStatusEnum = z.enum([
  "PENDING_REQUEST",
  "REQUESTED",
  "REMINDED",
  "RECEIVED",
  "SUBMITTED",
]);

// Schema for creating a recommendation request (user input)
export const recommendationRequestSchema = z.object({
  applicationId: z.string().cuid(),
  recommenderName: z.string().min(1, "Recommender name is required"),
  recommenderEmail: z.string().email("Valid email address is required"),
  relationship: relationshipEnum,
  personalMessage: z.string().optional(),
});

// Schema for uploading a recommendation via token (public endpoint)
export const recommendationUploadSchema = z.object({
  token: z.string().length(64, "Invalid upload token format"),
  fileUrl: z.string().url("Valid file URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  mimeType: z.string().refine(
    (mime) => allowedMimeTypes.includes(mime),
    {
      message: `File type must be PDF or DOCX`,
    }
  ),
  message: z.string().optional(),
}).refine(
  (data) => {
    // File size limit: 10MB
    const maxFileSize = 10 * 1024 * 1024;
    return data.fileSize <= maxFileSize;
  },
  {
    message: "File size must not exceed 10MB",
    path: ["fileSize"],
  }
);

// Schema for filtering recommendations
export const recommendationFilterSchema = z.object({
  applicationId: z.string().cuid().optional(),
  status: recommendationStatusEnum.optional(),
  recommenderEmail: z.string().email().optional(),
});

// Type exports
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
export type RecommendationRequestInput = z.infer<typeof recommendationRequestSchema>;
export type RecommendationUploadInput = z.infer<typeof recommendationUploadSchema>;
export type RecommendationFilterInput = z.infer<typeof recommendationFilterSchema>;
