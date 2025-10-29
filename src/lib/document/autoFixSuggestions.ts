/**
 * Auto-Fix Suggestions for Document Validation Errors
 * Story 4.3: Document Compliance Validation
 *
 * Provides user-friendly suggestions for fixing document validation errors
 */

import { ValidationError, ValidationErrorCode, formatLabel } from "./validation";

/**
 * Gets suggested fix for a validation error
 *
 * @param error - Validation error object
 * @returns User-friendly suggestion text
 *
 * @example
 * ```typescript
 * const error = {
 *   code: ValidationErrorCode.FILE_TOO_LARGE,
 *   message: "File exceeds 5MB limit",
 *   details: { actualSizeMB: 7.2, maxSizeMB: 5 }
 * };
 * const suggestion = getSuggestedFix(error);
 * // "Compress your 7.2MB file to under 5MB using a PDF compressor..."
 * ```
 */
export function getSuggestedFix(error: ValidationError): string {
  switch (error.code) {
    case ValidationErrorCode.FILE_TOO_LARGE: {
      const actualSize = error.details?.actualSizeMB as number | undefined;
      const maxSize = error.details?.maxSizeMB as number | undefined;

      if (actualSize && maxSize) {
        return `Compress your ${actualSize.toFixed(1)}MB file to under ${maxSize}MB using a PDF compressor (e.g., SmallPDF, Adobe Acrobat, or ILovePDF)`;
      }
      return "Reduce the file size by compressing it or converting to a smaller format";
    }

    case ValidationErrorCode.WRONG_FORMAT: {
      const allowedFormats = error.details?.allowedFormats as string[] | undefined;

      if (allowedFormats) {
        const formatsStr = allowedFormats.map(formatLabel).join(" or ");
        return `Convert your file to ${formatsStr} format. Try using an online converter or "Save As" in your document editor.`;
      }
      return "Convert your file to the required format";
    }

    case ValidationErrorCode.NAMING_PATTERN_MISMATCH: {
      const example = error.details?.example as string | undefined;

      if (example) {
        return `Rename your file to match this pattern: ${example}`;
      }
      return "Rename your file to match the required naming convention";
    }

    case ValidationErrorCode.MISSING_REQUIRED_DOCUMENT:
      return "Upload the required document to complete your application";

    default:
      return "Please correct this issue before submitting";
  }
}

/**
 * Gets multiple suggestions for an array of errors
 *
 * @param errors - Array of validation errors
 * @returns Array of suggestion strings
 */
export function getSuggestedFixes(errors: ValidationError[]): string[] {
  return errors.map(getSuggestedFix);
}

/**
 * Checks if an error has an available auto-fix action
 * Currently only naming pattern errors support one-click auto-fix
 *
 * @param error - Validation error object
 * @returns True if auto-fix is available
 */
export function hasAutoFix(error: ValidationError): boolean {
  return error.code === ValidationErrorCode.NAMING_PATTERN_MISMATCH;
}

/**
 * Generates a compliant filename based on naming pattern and example
 *
 * @param currentName - Current file name
 * @param example - Example naming pattern (e.g., "LastName_FirstName_Transcript.pdf")
 * @param firstName - Student's first name
 * @param lastName - Student's last name
 * @returns Suggested compliant filename
 *
 * @example
 * ```typescript
 * const newName = generateCompliantFilename(
 *   "transcript.pdf",
 *   "LastName_FirstName_Transcript.pdf",
 *   "John",
 *   "Doe"
 * );
 * // "Doe_John_Transcript.pdf"
 * ```
 */
export function generateCompliantFilename(
  currentName: string,
  example: string,
  firstName: string,
  lastName: string
): string {
  // Extract file extension from current name
  const extension = currentName.split(".").pop() || "pdf";

  // Replace placeholders in example
  let compliantName = example;
  compliantName = compliantName.replace(/LastName/gi, lastName);
  compliantName = compliantName.replace(/FirstName/gi, firstName);

  // Ensure extension matches
  const exampleExt = example.split(".").pop();
  if (exampleExt !== extension) {
    compliantName = compliantName.replace(
      new RegExp(`\\.${exampleExt}$`),
      `.${extension}`
    );
  }

  return compliantName;
}
