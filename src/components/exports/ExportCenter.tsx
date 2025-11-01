/**
 * ExportCenter Component
 *
 * Modal for exporting scholarship data in various formats.
 * Features:
 * - Export Applications List (CSV)
 * - Export Funding Summary (PDF)
 * - Export Analytics Report (PDF)
 * - Privacy controls
 * - Loading states and error handling
 *
 * Story: 5.9 - Export & Reporting (AC #1, #5, #6)
 * @module components/exports/ExportCenter
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FileSpreadsheet, FileText, BarChart3, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/shared/lib/trpc";
import { generateApplicationsCsvBlob, generateCsvFilename } from "@/lib/exports/csv-generator";
import { generateFundingSummaryPDF, generateAnalyticsPDF, generatePdfFilename } from "@/lib/exports/pdf-generator";
import { ExportType, ExportFormat } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

interface ExportCenterProps {
  open: boolean;
  onClose: () => void;
}

type ExportTypeOption = "CSV" | "FUNDING_PDF" | "ANALYTICS_PDF";

export function ExportCenter({ open, onClose }: ExportCenterProps) {
  const { toast } = useToast();
  const [selectedExportType, setSelectedExportType] = useState<ExportTypeOption>("CSV");
  const [excludePersonalInfo, setExcludePersonalInfo] = useState(false);
  const [excludeSensitiveDetails, setExcludeSensitiveDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const logExportMutation = trpc.exports.logExport.useMutation();
  const utils = trpc.useContext();

  const privacySettings = {
    excludePersonalInfo,
    excludeSensitiveDetails,
  };

  // Export handlers
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch data using tRPC client utilities
      const applications = await utils.client.exports.getApplicationsForExport.query({});

      // Generate CSV
      const csvBlob = generateApplicationsCsvBlob(applications as any, privacySettings);
      const filename = generateCsvFilename("student", privacySettings);

      // Trigger download
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log export
      await logExportMutation.mutateAsync({
        exportType: ExportType.APPLICATIONS_LIST,
        format: ExportFormat.CSV,
        privacySettings,
        fileSize: csvBlob.size,
      });

      toast({
        title: "Export successful!",
        description: `Downloaded ${filename}`,
      });

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while generating the export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFundingPDF = async () => {
    setIsExporting(true);
    try {
      // Fetch data using tRPC client utilities
      const { studentData, fundingData } = await utils.client.exports.getFundingData.query({});

      // Generate PDF
      const pdfBlob = await generateFundingSummaryPDF(studentData, fundingData, privacySettings);
      const filename = generatePdfFilename(
        "funding-summary",
        `${studentData.firstName} ${studentData.lastName}`,
        privacySettings
      );

      // Trigger download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log export
      await logExportMutation.mutateAsync({
        exportType: ExportType.FUNDING_SUMMARY,
        format: ExportFormat.PDF,
        privacySettings,
        fileSize: pdfBlob.size,
      });

      toast({
        title: "Export successful!",
        description: `Downloaded ${filename}`,
      });

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAnalyticsPDF = async () => {
    setIsExporting(true);
    try {
      // Fetch data using tRPC client utilities
      const { studentData, analyticsData } = await utils.client.exports.getAnalyticsData.query({});

      // Generate PDF
      const pdfBlob = await generateAnalyticsPDF(analyticsData, studentData, privacySettings);
      const filename = generatePdfFilename(
        "analytics-report",
        `${studentData.firstName} ${studentData.lastName}`,
        privacySettings
      );

      // Trigger download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log export
      await logExportMutation.mutateAsync({
        exportType: ExportType.ANALYTICS_REPORT,
        format: ExportFormat.PDF,
        privacySettings,
        fileSize: pdfBlob.size,
      });

      toast({
        title: "Export successful!",
        description: `Downloaded ${filename}`,
      });

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    switch (selectedExportType) {
      case "CSV":
        return handleExportCSV();
      case "FUNDING_PDF":
        return handleExportFundingPDF();
      case "ANALYTICS_PDF":
        return handleExportAnalyticsPDF();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose your export format and customize the data to include
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>Export Type</Label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedExportType("CSV")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
                  selectedExportType === "CSV"
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <FileSpreadsheet className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Applications List (CSV)</div>
                  <div className="text-sm text-muted-foreground">
                    Spreadsheet with all application data
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedExportType("FUNDING_PDF")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
                  selectedExportType === "FUNDING_PDF"
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <FileText className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Funding Summary (PDF)</div>
                  <div className="text-sm text-muted-foreground">
                    Professional report with awards and funding secured
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedExportType("ANALYTICS_PDF")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
                  selectedExportType === "ANALYTICS_PDF"
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <BarChart3 className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Analytics Report (PDF)</div>
                  <div className="text-sm text-muted-foreground">
                    Comprehensive report with metrics and insights
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="space-y-3">
            <Label>Privacy Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludePersonal"
                  checked={excludePersonalInfo}
                  onCheckedChange={(checked) =>
                    setExcludePersonalInfo(checked as boolean)
                  }
                />
                <label
                  htmlFor="excludePersonal"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Exclude personal information (name, email)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeSensitive"
                  checked={excludeSensitiveDetails}
                  onCheckedChange={(checked) =>
                    setExcludeSensitiveDetails(checked as boolean)
                  }
                />
                <label
                  htmlFor="excludeSensitive"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Exclude sensitive scholarship details
                </label>
              </div>
            </div>

            {!excludePersonalInfo && !excludeSensitiveDetails && (
              <p className="text-xs text-muted-foreground">
                This export will contain personal information. Handle securely.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
