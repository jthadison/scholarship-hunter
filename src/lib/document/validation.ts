/**
 * Document Compliance Validation Engine
 * Story 4.3: Document Compliance Validation
 *
 * Validates documents against scholarship-specific requirements:
 * - File format (MIME type)
 * - File size limits
 * - Naming pattern conventions
 */

import { DocumentType } from "@prisma/client";

// ============================================================================
// Types & Enums
// ============================================================================

export enum ValidationErrorCode {
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  WRONG_FORMAT = "WRONG_FORMAT",
  NAMING_PATTERN_MISMATCH = "NAMING_PATTERN_MISMATCH",
  MISSING_REQUIRED_DOCUMENT = "MISSING_REQUIRED_DOCUMENT",
}

export type ValidationError = {
  code: ValidationErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
};

export type DocumentRequirementRule = {
  required: boolean;
  allowedFormats: string[]; // MIME types
  maxSizeMB: number;
  namingPattern?: string; // Regex string
  namingExample?: string;
};

export type ValidationResult = {
  compliant: boolean;
  errors: ValidationError[];
};

export type DocumentRequirements = Partial<
  Record<DocumentType, DocumentRequirementRule>
>;

// ============================================================================
// Default Validation Rules
// ============================================================================

export const DEFAULT_DOCUMENT_REQUIREMENTS: Record<
  DocumentType,
  DocumentRequirementRule
> = {
  TRANSCRIPT: {
    required: true,
    allowedFormats: ["application/pdf"],
    maxSizeMB: 10,
  },
  RESUME: {
    required: true,
    allowedFormats: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSizeMB: 5,
  },
  PERSONAL_STATEMENT: {
    required: false,
    allowedFormats: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSizeMB: 5,
  },
  FINANCIAL_DOCUMENT: {
    required: false,
    allowedFormats: ["application/pdf"],
    maxSizeMB: 10,
  },
  RECOMMENDATION_LETTER: {
    required: false,
    allowedFormats: ["application/pdf"],
    maxSizeMB: 5,
  },
  SUPPLEMENTAL_MATERIAL: {
    required: false,
    allowedFormats: ["application/pdf", "image/png", "image/jpeg"],
    maxSizeMB: 10,
  },
  OTHER: {
    required: false,
    allowedFormats: ["application/pdf"],
    maxSizeMB: 10,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts MIME type to human-readable format label
 */
export function formatLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "image/png": "PNG",
    "image/jpeg": "JPEG",
  };
  return labels[mimeType] || mimeType;
}

/**
 * Formats allowed formats array to human-readable string
 */
function formatAllowedFormats(formats: string[]): string {
  return formats.map(formatLabel).join(" or ");
}

// ============================================================================
// Core Validation Function
// ============================================================================

/**
 * Validates a file against document requirements
 *
 * @param file - File object to validate
 * @param requirements - Document requirement rules
 * @returns ValidationResult with compliant flag and errors
 *
 * @example
 * ```typescript
 * const file = new File([content], "transcript.pdf", { type: "application/pdf" });
 * const requirements = { required: true, allowedFormats: ["application/pdf"], maxSizeMB: 5 };
 * const result = validateDocument(file, requirements);
 * // result = { compliant: true, errors: [] }
 * ```
 */
export function validateDocument(
  file: File,
  requirements: DocumentRequirementRule
): ValidationResult {
  const errors: ValidationError[] = [];

  // Format validation
  if (!requirements.allowedFormats.includes(file.type)) {
    errors.push({
      code: ValidationErrorCode.WRONG_FORMAT,
      message: `File must be ${formatAllowedFormats(requirements.allowedFormats)}`,
      field: "format",
      details: {
        actualFormat: file.type,
        allowedFormats: requirements.allowedFormats,
      },
    });
  }

  // Size validation
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > requirements.maxSizeMB) {
    errors.push({
      code: ValidationErrorCode.FILE_TOO_LARGE,
      message: `File exceeds ${requirements.maxSizeMB}MB limit (your file: ${fileSizeMB.toFixed(1)}MB)`,
      field: "size",
      details: {
        actualSizeMB: fileSizeMB,
        maxSizeMB: requirements.maxSizeMB,
      },
    });
  }

  // Naming pattern validation (optional)
  if (requirements.namingPattern) {
    const pattern = new RegExp(requirements.namingPattern);
    if (!pattern.test(file.name)) {
      errors.push({
        code: ValidationErrorCode.NAMING_PATTERN_MISMATCH,
        message: `File name must match pattern${requirements.namingExample ? ": " + requirements.namingExample : ""}`,
        field: "name",
        details: {
          pattern: requirements.namingPattern,
          actualName: file.name,
          example: requirements.namingExample,
        },
      });
    }
  }

  return {
    compliant: errors.length === 0,
    errors,
  };
}

/**
 * Gets validation requirements for a document type
 * Falls back to default requirements if scholarship has none defined
 *
 * @param documentType - Type of document
 * @param scholarshipRequirements - Scholarship-specific requirements (optional)
 * @returns Document requirement rules
 */
export function getDocumentRequirements(
  documentType: DocumentType,
  scholarshipRequirements?: DocumentRequirements | null
): DocumentRequirementRule {
  if (
    scholarshipRequirements &&
    scholarshipRequirements[documentType]
  ) {
    return scholarshipRequirements[documentType]!;
  }

  return DEFAULT_DOCUMENT_REQUIREMENTS[documentType];
}

/**
 * Validates multiple documents against requirements
 * Useful for batch validation
 *
 * @param files - Array of files with their document types
 * @param scholarshipRequirements - Scholarship-specific requirements
 * @returns Map of file names to validation results
 */
export function validateDocuments(
  files: Array<{ file: File; type: DocumentType }>,
  scholarshipRequirements?: DocumentRequirements | null
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const { file, type } of files) {
    const requirements = getDocumentRequirements(type, scholarshipRequirements);
    const result = validateDocument(file, requirements);
    results.set(file.name, result);
  }

  return results;
}
