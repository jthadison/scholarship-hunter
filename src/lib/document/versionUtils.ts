import { type Document } from "@prisma/client";
import { db } from "../../server/db";

/**
 * Traverse version chain to get all versions of a document
 * Returns versions from newest to oldest
 *
 * @throws Error if circular reference detected or max depth exceeded
 */
export async function getVersionHistory(
  documentId: string
): Promise<Document[]> {
  const MAX_VERSIONS = 100; // Prevent infinite loops
  const versions: Document[] = [];
  const visitedIds = new Set<string>();

  let current = await db.document.findUnique({
    where: { id: documentId },
  });

  if (!current) {
    throw new Error(`Document not found: ${documentId}`);
  }

  while (current) {
    // Check for circular reference
    if (visitedIds.has(current.id)) {
      throw new Error(
        `Circular reference detected in version chain for document: ${documentId}`
      );
    }

    // Check for max depth (prevent infinite loops)
    if (versions.length >= MAX_VERSIONS) {
      throw new Error(
        `Maximum version depth (${MAX_VERSIONS}) exceeded for document: ${documentId}`
      );
    }

    visitedIds.add(current.id);
    versions.push(current);

    if (current.previousVersionId) {
      current = await db.document.findUnique({
        where: { id: current.previousVersionId },
      });
    } else {
      break;
    }
  }

  return versions;
}

/**
 * Get version history using PostgreSQL recursive CTE for better performance
 * Recommended for documents with 20+ versions
 */
export async function getVersionHistoryCTE(
  documentId: string
): Promise<Document[]> {
  const versions = await db.$queryRaw<Document[]>`
    WITH RECURSIVE version_chain AS (
      SELECT * FROM "Document" WHERE id = ${documentId}
      UNION ALL
      SELECT d.* FROM "Document" d
      INNER JOIN version_chain vc ON d.id = vc."previousVersionId"
    )
    SELECT * FROM version_chain ORDER BY version DESC
  `;

  return versions;
}

/**
 * Find the current version of a document by name and type
 * Current version = highest version number with no successor
 */
export async function findCurrentVersion(
  studentId: string,
  name: string,
  type: string
): Promise<Document | null> {
  const currentVersion = await db.document.findFirst({
    where: {
      studentId,
      name,
      type,
      nextVersions: { none: {} }, // No documents have this as previousVersion
    },
    orderBy: { version: "desc" },
  });

  return currentVersion;
}

/**
 * Get the next version number for a document
 */
export async function getNextVersionNumber(
  studentId: string,
  name: string,
  type: string
): Promise<number> {
  const currentVersion = await findCurrentVersion(studentId, name, type);
  return currentVersion ? currentVersion.version + 1 : 1;
}

/**
 * Check if a document has any versions
 */
export async function hasVersions(documentId: string): Promise<boolean> {
  const document = await db.document.findUnique({
    where: { id: documentId },
    include: {
      previousVersion: true,
      nextVersions: true,
    },
  });

  if (!document) return false;

  return !!(document.previousVersionId || document.nextVersions.length > 0);
}

/**
 * Get version count for a document chain
 */
export async function getVersionCount(documentId: string): Promise<number> {
  const versions = await getVersionHistory(documentId);
  return versions.length;
}

/**
 * Check if a document is the current version
 */
export async function isCurrentVersion(documentId: string): Promise<boolean> {
  const document = await db.document.findUnique({
    where: { id: documentId },
    include: {
      nextVersions: true,
    },
  });

  if (!document) return false;

  return document.nextVersions.length === 0;
}
