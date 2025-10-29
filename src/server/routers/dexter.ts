import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { DocumentType } from "@prisma/client";
import { getDocumentRequirements } from "../../lib/document/validation";
import type { DocumentRequirements } from "../../lib/document/validation";

/**
 * Dexter Router
 * Handles Dexter dashboard data aggregation and proactive document management
 * Story 4.5: Dexter Agent - Document Manager Dashboard
 */

export const dexterRouter = router({
  /**
   * Get document summary for dashboard overview
   * AC1: Document vault overview, recent uploads, compliance status
   */
  getDocumentSummary: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get document count by category
      const documentsByType = await ctx.prisma.document.groupBy({
        by: ["type"],
        where: { studentId: input.studentId },
        _count: { id: true },
      });

      // Calculate total storage used
      const storageAggregate = await ctx.prisma.document.aggregate({
        where: { studentId: input.studentId },
        _sum: { fileSize: true },
        _count: true,
      });

      // Get recent uploads (last 10)
      const recentUploads = await ctx.prisma.document.findMany({
        where: { studentId: input.studentId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          application: {
            select: {
              id: true,
              scholarship: { select: { name: true } },
            },
          },
        },
      });

      // Count documents by version (identify documents with multiple versions)
      const documentsWithVersions = await ctx.prisma.$queryRaw<
        Array<{ name: string; type: DocumentType; maxVersion: number }>
      >`
        SELECT name, type, MAX(version) as "maxVersion"
        FROM "Document"
        WHERE "studentId" = ${input.studentId}
        GROUP BY name, type
        HAVING MAX(version) > 1
      `;

      return {
        totalDocs: storageAggregate._count,
        byCategory: documentsByType.map((group) => ({
          type: group.type,
          count: group._count.id,
        })),
        storageUsed: storageAggregate._sum.fileSize ?? 0,
        storageQuota: 100 * 1024 * 1024, // 100MB quota
        recentUploads: recentUploads.map((doc) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          createdAt: doc.createdAt,
          compliant: doc.compliant,
          applicationName: doc.application?.scholarship.name,
        })),
        documentsWithVersions: documentsWithVersions.length,
      };
    }),

  /**
   * Get compliance status across all applications
   * AC1, AC2: Compliance status overview with proactive warnings
   */
  getComplianceStatus: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get all active applications with documents and requirements
      const applications = await ctx.prisma.application.findMany({
        where: {
          studentId: input.studentId,
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        include: {
          scholarship: {
            select: {
              name: true,
              deadline: true,
              documentRequirements: true,
            },
          },
          documents: {
            select: {
              id: true,
              name: true,
              type: true,
              compliant: true,
              validationErrors: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
        orderBy: {
          scholarship: {
            deadline: "asc",
          },
        },
      });

      // Analyze compliance for each application
      const complianceStatus = applications.map((app) => {
        const scholarshipReqs = app.scholarship
          .documentRequirements as DocumentRequirements | null;

        // Determine required document types based on scholarship requirements
        const requiredTypes: DocumentType[] = [];
        if (scholarshipReqs) {
          // Get required types from scholarship requirements
          Object.entries(scholarshipReqs).forEach(([type, rule]) => {
            if (rule && rule.required) {
              requiredTypes.push(type as DocumentType);
            }
          });
        }
        // Default required documents if none specified
        if (requiredTypes.length === 0) {
          requiredTypes.push(DocumentType.TRANSCRIPT, DocumentType.RESUME);
        }

        // Check which required documents are uploaded
        const uploadedTypes = new Set(app.documents.map((d) => d.type));
        const missingTypes = requiredTypes.filter((t) => !uploadedTypes.has(t));

        // Count compliant vs non-compliant documents
        const compliantDocs = app.documents.filter((d) => d.compliant).length;
        const violationDocs = app.documents.filter((d) => !d.compliant);

        // Determine overall compliance status
        let status: "COMPLIANT" | "MISSING_DOCS" | "VIOLATIONS" | "INCOMPLETE";
        if (missingTypes.length > 0 && violationDocs.length > 0) {
          status = "INCOMPLETE";
        } else if (violationDocs.length > 0) {
          status = "VIOLATIONS";
        } else if (missingTypes.length > 0) {
          status = "MISSING_DOCS";
        } else {
          status = "COMPLIANT";
        }

        return {
          applicationId: app.id,
          scholarshipName: app.scholarship.name,
          deadline: app.scholarship.deadline,
          requiredDocsCount: requiredTypes.length,
          uploadedDocsCount: app._count.documents,
          compliantDocsCount: compliantDocs,
          status,
          missingTypes,
          violations: violationDocs.map((d) => ({
            documentId: d.id,
            name: d.name,
            type: d.type,
            errors: d.validationErrors,
          })),
        };
      });

      // Calculate aggregate statistics
      const totalApplications = applications.length;
      const compliantApplications = complianceStatus.filter(
        (s) => s.status === "COMPLIANT"
      ).length;

      return {
        applications: complianceStatus,
        summary: {
          totalApplications,
          compliantApplications,
          percentageCompliant:
            totalApplications > 0
              ? Math.round((compliantApplications / totalApplications) * 100)
              : 0,
        },
      };
    }),

  /**
   * Get recommendation status tracking
   * AC3: Recommendations ready status
   */
  getRecommendationStatus: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get all recommendations for student's applications
      const recommendations = await ctx.prisma.recommendation.findMany({
        where: {
          application: {
            studentId: input.studentId,
          },
        },
        include: {
          application: {
            select: {
              id: true,
              scholarship: {
                select: {
                  name: true,
                  deadline: true,
                },
              },
            },
          },
        },
        orderBy: {
          requestedAt: "desc",
        },
      });

      // Calculate statistics
      const total = recommendations.length;
      const received = recommendations.filter((r) => r.status === "RECEIVED").length;
      const pending = recommendations.filter(
        (r) =>
          r.status === "PENDING_REQUEST" ||
          r.status === "REQUESTED" ||
          r.status === "REMINDED"
      ).length;

      // Identify overdue recommendations
      const now = new Date();
      const overdueRecs = recommendations.filter(
        (r) =>
          r.status !== "RECEIVED" &&
          r.status !== "SUBMITTED" &&
          r.application.scholarship.deadline < now
      );

      // Get pending recommendation details
      const pendingList = recommendations
        .filter(
          (r) =>
            r.status === "PENDING_REQUEST" ||
            r.status === "REQUESTED" ||
            r.status === "REMINDED"
        )
        .map((r) => {
          const daysUntilDue = Math.ceil(
            (r.application.scholarship.deadline.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          return {
            id: r.id,
            recommenderName: r.recommenderName,
            recommenderEmail: r.recommenderEmail,
            scholarshipName: r.application.scholarship.name,
            applicationId: r.applicationId,
            deadline: r.application.scholarship.deadline,
            daysUntilDue,
            requestedAt: r.requestedAt,
            status: r.status,
            reminderCount: r.reminderCount,
            isOverdue: daysUntilDue < 0,
          };
        });

      return {
        total,
        received,
        pending,
        overdue: overdueRecs.length,
        pendingList,
      };
    }),

  /**
   * Get proactive warnings about missing documents, compliance issues, and overdue recommendations
   * AC2: Proactive warnings with actionable messages
   */
  getProactiveWarnings: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      interface Warning {
        id: string;
        type: "MISSING_DOCUMENT" | "COMPLIANCE_VIOLATION" | "OVERDUE_RECOMMENDATION";
        severity: "critical" | "warning" | "info";
        message: string;
        applicationId?: string;
        scholarshipName?: string;
        documentId?: string;
        recommendationId?: string;
        actionLink?: string;
      }

      const warnings: Warning[] = [];

      // Get applications with document requirements
      const applications = await ctx.prisma.application.findMany({
        where: {
          studentId: input.studentId,
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        include: {
          scholarship: {
            select: {
              name: true,
              deadline: true,
              documentRequirements: true,
            },
          },
          documents: {
            select: {
              id: true,
              name: true,
              type: true,
              compliant: true,
              validationErrors: true,
            },
          },
          recommendations: {
            select: {
              id: true,
              recommenderName: true,
              status: true,
            },
          },
        },
      });

      // Check each application for issues
      applications.forEach((app) => {
        const scholarshipReqs = app.scholarship
          .documentRequirements as DocumentRequirements | null;

        // Determine required document types
        const requiredTypes: DocumentType[] = [];
        if (scholarshipReqs) {
          Object.entries(scholarshipReqs).forEach(([type, rule]) => {
            if (rule && rule.required) {
              requiredTypes.push(type as DocumentType);
            }
          });
        }
        if (requiredTypes.length === 0) {
          requiredTypes.push(DocumentType.TRANSCRIPT, DocumentType.RESUME);
        }

        // Check for missing required documents
        const uploadedTypes = new Set(app.documents.map((d) => d.type));
        const missingTypes = requiredTypes.filter((t) => !uploadedTypes.has(t));

        if (missingTypes.length > 0) {
          const typeLabels: Record<DocumentType, string> = {
            TRANSCRIPT: "Transcript",
            RESUME: "Resume",
            PERSONAL_STATEMENT: "Personal Statement",
            FINANCIAL_DOCUMENT: "Financial Document",
            RECOMMENDATION_LETTER: "Recommendation Letter",
            SUPPLEMENTAL_MATERIAL: "Supplemental Material",
            OTHER: "Other Document",
          };

          const missingNames = missingTypes.map((t) => typeLabels[t]).join(", ");

          warnings.push({
            id: `missing-${app.id}`,
            type: "MISSING_DOCUMENT",
            severity: "critical",
            message: `${app.scholarship.name} needs ${missingTypes.length} document(s): ${missingNames}`,
            applicationId: app.id,
            scholarshipName: app.scholarship.name,
            actionLink: `/applications/${app.id}/documents`,
          });
        }

        // Check for compliance violations
        const violationDocs = app.documents.filter((d) => !d.compliant);
        violationDocs.forEach((doc) => {
          const errors = doc.validationErrors as Array<{ code: string; message: string }> | null;
          const errorMsg = errors?.map((e) => e.message).join("; ") || "Compliance issue";

          warnings.push({
            id: `violation-${doc.id}`,
            type: "COMPLIANCE_VIOLATION",
            severity: "warning",
            message: `${doc.name} for ${app.scholarship.name}: ${errorMsg}`,
            applicationId: app.id,
            scholarshipName: app.scholarship.name,
            documentId: doc.id,
            actionLink: `/applications/${app.id}/documents/${doc.id}`,
          });
        });

        // Check for overdue recommendations
        const now = new Date();
        const overdueRecs = app.recommendations.filter(
          (r) =>
            r.status !== "RECEIVED" &&
            r.status !== "SUBMITTED" &&
            app.scholarship.deadline < now
        );

        overdueRecs.forEach((rec) => {
          warnings.push({
            id: `overdue-rec-${rec.id}`,
            type: "OVERDUE_RECOMMENDATION",
            severity: "warning",
            message: `Recommendation from ${rec.recommenderName} for ${app.scholarship.name} is overdue`,
            applicationId: app.id,
            scholarshipName: app.scholarship.name,
            recommendationId: rec.id,
            actionLink: `/applications/${app.id}/recommendations`,
          });
        });
      });

      // Sort warnings by severity (critical first)
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      return {
        warnings,
        counts: {
          critical: warnings.filter((w) => w.severity === "critical").length,
          warning: warnings.filter((w) => w.severity === "warning").length,
          info: warnings.filter((w) => w.severity === "info").length,
          total: warnings.length,
        },
      };
    }),

  /**
   * Run comprehensive compliance check across all documents
   * AC4: Run compliance check quick action
   */
  runComplianceCheck: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this student profile
      const student = await ctx.prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student || student.userId !== ctx.userId) {
        throw new Error("Unauthorized: You do not own this student profile");
      }

      // Get all documents for the student
      const documents = await ctx.prisma.document.findMany({
        where: { studentId: input.studentId },
        include: {
          application: {
            select: {
              id: true,
              scholarship: {
                select: {
                  name: true,
                  documentRequirements: true,
                },
              },
            },
          },
        },
      });

      interface ComplianceIssue {
        documentId: string;
        documentName: string;
        scholarshipName: string | null;
        issues: Array<{ code: string; message: string; autoFixAvailable: boolean }>;
      }

      const issues: ComplianceIssue[] = [];
      let totalChecked = documents.length;
      let passedCount = 0;
      let failedCount = 0;

      // Re-validate each document
      for (const doc of documents) {
        const docIssues: Array<{ code: string; message: string; autoFixAvailable: boolean }> = [];

        if (doc.application) {
          const scholarshipReqs = doc.application.scholarship
            .documentRequirements as DocumentRequirements | null;
          const requirements = getDocumentRequirements(doc.type, scholarshipReqs);

          // Check file format
          if (!requirements.allowedFormats.includes(doc.mimeType)) {
            docIssues.push({
              code: "WRONG_FORMAT",
              message: `File format not allowed. Use PDF or DOCX.`,
              autoFixAvailable: false,
            });
          }

          // Check file size
          const fileSizeMB = doc.fileSize / (1024 * 1024);
          if (fileSizeMB > requirements.maxSizeMB) {
            docIssues.push({
              code: "FILE_TOO_LARGE",
              message: `File exceeds ${requirements.maxSizeMB}MB limit (${fileSizeMB.toFixed(1)}MB)`,
              autoFixAvailable: true, // Could suggest compression
            });
          }

          // Check naming pattern
          if (requirements.namingPattern) {
            const pattern = new RegExp(requirements.namingPattern);
            if (!pattern.test(doc.fileName)) {
              docIssues.push({
                code: "NAMING_PATTERN_MISMATCH",
                message: `File name doesn't match required pattern${requirements.namingExample ? ": " + requirements.namingExample : ""}`,
                autoFixAvailable: false,
              });
            }
          }
        }

        if (docIssues.length > 0) {
          issues.push({
            documentId: doc.id,
            documentName: doc.name,
            scholarshipName: doc.application?.scholarship.name ?? null,
            issues: docIssues,
          });
          failedCount++;
        } else {
          passedCount++;
        }
      }

      return {
        timestamp: new Date(),
        summary: {
          totalChecked,
          passed: passedCount,
          failed: failedCount,
        },
        issues,
        message:
          failedCount === 0
            ? "Excellent! All your documents are organized and compliant. ✓"
            : failedCount === 1
              ? "Almost there! Just 1 item to address."
              : `Let's fix these ${failedCount} items before submission.`,
      };
    }),
});
