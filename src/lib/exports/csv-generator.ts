/**
 * CSV Generation Utility for Scholarship Applications Export
 * Story 5.9: Export & Reporting
 */

import type { Application, Scholarship, Outcome } from "@prisma/client";

export interface ApplicationWithDetails extends Application {
  scholarship: Scholarship;
  outcome: Outcome | null;
}

export interface PrivacySettings {
  excludePersonalInfo?: boolean;
  excludeSensitiveDetails?: boolean;
}

/**
 * Escapes special characters in CSV fields
 * Handles commas, quotes, and newlines
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the field contains comma, quote, or newline, wrap it in quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a date as YYYY-MM-DD for Excel compatibility
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Formats currency as integer without symbols for data portability
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return String(Math.round(amount));
}

/**
 * Generates CSV content from application data
 *
 * @param applications - Array of applications with related scholarship and outcome data
 * @param privacySettings - Privacy controls for data redaction
 * @returns CSV content as string
 */
export function generateApplicationsCSV(
  applications: ApplicationWithDetails[],
  privacySettings: PrivacySettings = {}
): string {
  // Define CSV headers
  const headers = [
    "Scholarship Name",
    "Provider",
    "Award Amount",
    "Deadline",
    "Application Status",
    "Outcome",
    "Date Applied",
    "Award Received",
    "Decision Date",
  ];

  // Build header row
  const rows: string[] = [headers.join(",")];

  // Map application data to CSV rows
  for (const app of applications) {
    const scholarship = app.scholarship;
    const outcome = app.outcome;

    // Apply privacy settings
    const scholarshipName = privacySettings.excludeSensitiveDetails
      ? "[REDACTED]"
      : escapeCsvField(scholarship.name);

    const provider = privacySettings.excludeSensitiveDetails
      ? "[REDACTED]"
      : escapeCsvField(scholarship.provider);

    const row = [
      scholarshipName,
      provider,
      formatCurrency(scholarship.awardAmount),
      formatDate(scholarship.deadline),
      escapeCsvField(app.status),
      escapeCsvField(outcome?.result || "PENDING"),
      formatDate(app.dateAdded),
      formatCurrency(outcome?.awardAmountReceived),
      formatDate(outcome?.decisionDate),
    ];

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Generates CSV Blob for download
 *
 * @param applications - Array of applications with related scholarship and outcome data
 * @param privacySettings - Privacy controls for data redaction
 * @returns Blob with CSV content and proper MIME type
 */
export function generateApplicationsCsvBlob(
  applications: ApplicationWithDetails[],
  privacySettings: PrivacySettings = {}
): Blob {
  const csvContent = generateApplicationsCSV(applications, privacySettings);

  // Create Blob with UTF-8 encoding
  return new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
}

/**
 * Generates filename for CSV export
 *
 * @param studentName - Student's name (optional, redacted if privacy enabled)
 * @param privacySettings - Privacy controls
 * @returns Filename string
 */
export function generateCsvFilename(
  studentName: string | null,
  privacySettings: PrivacySettings = {}
): string {
  const name = privacySettings.excludePersonalInfo
    ? "student"
    : (studentName || "student").toLowerCase().replace(/\s+/g, "-");

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return `scholarship-applications-${name}-${date}.csv`;
}
