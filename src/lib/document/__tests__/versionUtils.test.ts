import { describe, it, expect, beforeEach, vi } from "vitest";
import { type Document } from "@prisma/client";
import {
  getVersionHistory,
  findCurrentVersion,
  getNextVersionNumber,
  hasVersions,
  isCurrentVersion,
} from "../versionUtils";

// Mock the database
vi.mock("../../../server/db", () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma as db } from "../../../server/db";

const mockDocument = (id: string, version: number, previousVersionId: string | null): Document =>
  ({
    id,
    studentId: "student1",
    applicationId: null,
    name: "Resume",
    type: "RESUME",
    fileName: "resume.pdf",
    fileSize: 100000,
    mimeType: "application/pdf",
    storagePath: `/student1/RESUME/resume_v${version}.pdf`,
    bucketName: "documents",
    version,
    previousVersionId,
    versionNote: null,
    compliant: false,
    validationErrors: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Document;

describe("versionUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVersionHistory", () => {
    it("should return single version for document with no history", async () => {
      const doc1 = mockDocument("doc1", 1, null);

      vi.mocked(db.document.findUnique).mockResolvedValue(doc1);

      const history = await getVersionHistory("doc1");

      expect(history).toHaveLength(1);
      expect(history[0]?.id).toBe("doc1");
      expect(history[0]?.version).toBe(1);
    });

    it("should return full version chain in order (newest to oldest)", async () => {
      const doc1 = mockDocument("doc1", 1, null);
      const doc2 = mockDocument("doc2", 2, "doc1");
      const doc3 = mockDocument("doc3", 3, "doc2");

      const docMap = new Map([
        ["doc3", doc3],
        ["doc2", doc2],
        ["doc1", doc1],
      ]);

      // @ts-expect-error - Prisma mock type incompatibility with vitest
      vi.mocked(db.document.findUnique).mockImplementation(async ({ where }) => {
        return docMap.get(where.id as string) || null;
      });

      const history = await getVersionHistory("doc3");

      expect(history).toHaveLength(3);
      expect(history[0]?.id).toBe("doc3");
      expect(history[1]?.id).toBe("doc2");
      expect(history[2]?.id).toBe("doc1");
    });

    it("should throw error if document not found", async () => {
      vi.mocked(db.document.findUnique).mockResolvedValue(null);

      await expect(getVersionHistory("nonexistent")).rejects.toThrow("Document not found");
    });

    it("should throw error on circular reference", async () => {
      const doc1 = mockDocument("doc1", 1, "doc2"); // Points to doc2
      const doc2 = mockDocument("doc2", 2, "doc1"); // Points back to doc1

      const docMap = new Map([
        ["doc1", doc1],
        ["doc2", doc2],
      ]);

      // @ts-expect-error - Prisma mock type incompatibility with vitest
      vi.mocked(db.document.findUnique).mockImplementation(async ({ where }) => {
        return docMap.get(where.id as string) || null;
      });

      await expect(getVersionHistory("doc1")).rejects.toThrow("Circular reference detected");
    });

    it("should throw error if max depth exceeded", async () => {
      // Create documents that form a very long chain
      const docs = new Map<string, Document>();
      for (let i = 0; i < 102; i++) {
        const prevId = i > 0 ? `doc${i - 1}` : null;
        docs.set(`doc${i}`, mockDocument(`doc${i}`, i + 1, prevId));
      }

      vi.mocked(db.document.findUnique).mockImplementation(async ({ where }) => {
        return docs.get(where.id as string) || null;
      });

      await expect(getVersionHistory("doc101")).rejects.toThrow(
        "Maximum version depth (100) exceeded"
      );
    });
  });

  describe("findCurrentVersion", () => {
    it("should find document with no successors", async () => {
      const currentDoc = mockDocument("doc3", 3, "doc2");

      vi.mocked(db.document.findFirst).mockResolvedValueOnce(currentDoc);

      const result = await findCurrentVersion("student1", "Resume", "RESUME");

      expect(result).toBeDefined();
      expect(result?.id).toBe("doc3");
      expect(result?.version).toBe(3);
    });

    it("should return null if no document found", async () => {
      vi.mocked(db.document.findFirst).mockResolvedValueOnce(null);

      const result = await findCurrentVersion("student1", "Resume", "RESUME");

      expect(result).toBeNull();
    });
  });

  describe("getNextVersionNumber", () => {
    it("should return 2 for existing v1 document", async () => {
      const doc1 = mockDocument("doc1", 1, null);

      vi.mocked(db.document.findFirst).mockResolvedValueOnce(doc1);

      const nextVersion = await getNextVersionNumber("student1", "Resume", "RESUME");

      expect(nextVersion).toBe(2);
    });

    it("should return 1 for new document", async () => {
      vi.mocked(db.document.findFirst).mockResolvedValueOnce(null);

      const nextVersion = await getNextVersionNumber("student1", "Resume", "RESUME");

      expect(nextVersion).toBe(1);
    });

    it("should return 4 for existing v3 document", async () => {
      const doc3 = mockDocument("doc3", 3, "doc2");

      vi.mocked(db.document.findFirst).mockResolvedValueOnce(doc3);

      const nextVersion = await getNextVersionNumber("student1", "Resume", "RESUME");

      expect(nextVersion).toBe(4);
    });
  });

  describe("hasVersions", () => {
    it("should return true if document has previous version", async () => {
      const doc2 = {
        ...mockDocument("doc2", 2, "doc1"),
        previousVersion: mockDocument("doc1", 1, null),
        nextVersions: [],
      };

      vi.mocked(db.document.findUnique).mockResolvedValue(doc2 as any);

      const result = await hasVersions("doc2");

      expect(result).toBe(true);
    });

    it("should return true if document has next versions", async () => {
      const doc1 = {
        ...mockDocument("doc1", 1, null),
        previousVersion: null,
        nextVersions: [mockDocument("doc2", 2, "doc1")],
      };

      vi.mocked(db.document.findUnique).mockResolvedValue(doc1 as any);

      const result = await hasVersions("doc1");

      expect(result).toBe(true);
    });

    it("should return false if document has no versions", async () => {
      const doc1 = {
        ...mockDocument("doc1", 1, null),
        previousVersion: null,
        nextVersions: [],
      };

      vi.mocked(db.document.findUnique).mockResolvedValue(doc1 as any);

      const result = await hasVersions("doc1");

      expect(result).toBe(false);
    });

    it("should return false if document not found", async () => {
      vi.mocked(db.document.findUnique).mockResolvedValue(null);

      const result = await hasVersions("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("isCurrentVersion", () => {
    it("should return true for document with no successors", async () => {
      const doc = {
        ...mockDocument("doc3", 3, "doc2"),
        nextVersions: [],
      };

      vi.mocked(db.document.findUnique).mockResolvedValue(doc as any);

      const result = await isCurrentVersion("doc3");

      expect(result).toBe(true);
    });

    it("should return false for document with successors", async () => {
      const doc = {
        ...mockDocument("doc2", 2, "doc1"),
        nextVersions: [mockDocument("doc3", 3, "doc2")],
      };

      vi.mocked(db.document.findUnique).mockResolvedValue(doc as any);

      const result = await isCurrentVersion("doc2");

      expect(result).toBe(false);
    });

    it("should return false if document not found", async () => {
      vi.mocked(db.document.findUnique).mockResolvedValue(null);

      const result = await isCurrentVersion("nonexistent");

      expect(result).toBe(false);
    });
  });
});
