import { randomBytes } from "crypto";
import { prisma } from "../../server/db";

/**
 * Token Utility Functions for Recommendation Upload
 * Provides secure token generation and validation
 */

/**
 * Generates a cryptographically secure random token
 * @returns 64-character hexadecimal string
 */
export function generateUploadToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Validates an upload token and returns the associated recommendation
 * @param token - The upload token to validate
 * @throws Error if token is invalid, already used, or expired
 * @returns The valid recommendation with application and student data
 */
export async function validateUploadToken(token: string) {
  // 1. Find recommendation by uploadToken
  const recommendation = await prisma.recommendation.findUnique({
    where: { uploadToken: token },
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

  // 2. Check if token exists
  if (!recommendation) {
    throw new Error("Invalid upload token. Please contact the student for a new link.");
  }

  // 3. Check if already submitted
  if (recommendation.status === "RECEIVED" || recommendation.status === "SUBMITTED") {
    throw new Error("This recommendation has already been submitted. Thank you!");
  }

  // 4. Check if token is expired (optional: 30-day expiration)
  if (recommendation.uploadLinkExpiry) {
    const now = new Date();
    if (now > recommendation.uploadLinkExpiry) {
      throw new Error(
        "This upload link has expired. Please contact the student to request a new link."
      );
    }
  }

  return recommendation;
}

/**
 * Calculates token expiration date (30 days from now)
 * @returns Date object 30 days in the future
 */
export function calculateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}

/**
 * Checks if a recommender email already has a pending recommendation for this application
 * @param applicationId - The application ID
 * @param email - The recommender email
 * @returns Boolean indicating if duplicate exists
 */
export async function checkDuplicateRecommender(
  applicationId: string,
  email: string
): Promise<boolean> {
  const existing = await prisma.recommendation.findFirst({
    where: {
      applicationId,
      recommenderEmail: email,
      status: {
        in: ["PENDING_REQUEST", "REQUESTED", "REMINDED"],
      },
    },
  });

  return !!existing;
}

/**
 * Counts the number of recommendations for an application
 * @param applicationId - The application ID
 * @returns Count of recommendations
 */
export async function countRecommendations(applicationId: string): Promise<number> {
  return await prisma.recommendation.count({
    where: { applicationId },
  });
}
