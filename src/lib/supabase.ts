import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Client for Storage Operations
 * Used for document upload/download in Epic 4
 */

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

/**
 * Client-side Supabase client (uses anon key)
 * For use in browser/client components
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client (uses service role key)
 * For use in API routes and server components
 * Has full admin access - use with caution
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Storage bucket configuration
 */
export const STORAGE_CONFIG = {
  BUCKET_NAME: "documents",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_STORAGE_QUOTA: 100 * 1024 * 1024, // 100MB per student
  SIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain",
  ],
} as const;

/**
 * Generate storage path for document
 * Pattern: {studentId}/{documentType}/{timestamp}_{filename}
 */
export function generateStoragePath(
  studentId: string,
  documentType: string,
  fileName: string
): string {
  const timestamp = Date.now();
  // Sanitize filename to prevent path traversal
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${studentId}/${documentType}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number): {
  valid: boolean;
  error?: string;
} {
  if (fileSize > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  return { valid: true };
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): {
  valid: boolean;
  error?: string;
} {
  if (!STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType as typeof STORAGE_CONFIG.ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${STORAGE_CONFIG.ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Check storage quota for student
 */
export async function checkStorageQuota(
  _studentId: string,
  currentUsage: number,
  additionalSize: number
): Promise<{
  allowed: boolean;
  error?: string;
  percentageUsed?: number;
}> {
  const totalAfterUpload = currentUsage + additionalSize;

  if (totalAfterUpload > STORAGE_CONFIG.MAX_STORAGE_QUOTA) {
    const currentPercentage = Math.round(
      (currentUsage / STORAGE_CONFIG.MAX_STORAGE_QUOTA) * 100
    );
    return {
      allowed: false,
      error: `Storage quota exceeded. Current usage: ${currentPercentage}%. Maximum: ${STORAGE_CONFIG.MAX_STORAGE_QUOTA / 1024 / 1024}MB`,
      percentageUsed: currentPercentage,
    };
  }

  const percentageUsed = Math.round(
    (totalAfterUpload / STORAGE_CONFIG.MAX_STORAGE_QUOTA) * 100
  );

  return {
    allowed: true,
    percentageUsed,
  };
}
