/**
 * ExportHistory Component
 *
 * Displays past export records with re-download and delete options.
 * Features:
 * - Table showing export type, format, date range, downloaded date, file size
 * - Re-download action (regenerates fresh export)
 * - Delete action (removes record from history)
 * - 90-day retention notice
 * - Empty state when no exports exist
 *
 * Story: 5.9 - Export & Reporting (AC #7)
 * @module components/exports/ExportHistory
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Trash2, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { trpc } from "@/shared/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { ExportType, ExportFormat } from "@prisma/client";

export function ExportHistory() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportToDelete, setExportToDelete] = useState<string | null>(null);

  const { data: history, isLoading, refetch } = trpc.exports.getHistory.useQuery();
  const deleteExportMutation = trpc.exports.deleteExport.useMutation({
    onSuccess: () => {
      toast({
        title: "Export deleted",
        description: "The export record has been removed from your history.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getExportTypeLabel = (type: ExportType) => {
    switch (type) {
      case "APPLICATIONS_LIST":
        return "Applications List";
      case "FUNDING_SUMMARY":
        return "Funding Summary";
      case "ANALYTICS_REPORT":
        return "Analytics Report";
      case "FULL_DATA":
        return "Full Data Export";
      default:
        return type;
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case "CSV":
        return <FileSpreadsheet className="h-4 w-4" />;
      case "PDF":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDateRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return "All time";
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  };

  const handleDelete = (exportId: string) => {
    setExportToDelete(exportId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (exportToDelete) {
      deleteExportMutation.mutate({ exportId: exportToDelete });
      setDeleteDialogOpen(false);
      setExportToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No exports yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate your first report from the Analytics Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Export history is retained for 90 days for your convenience. Exports are generated
        on-demand for security.
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Export Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Downloaded</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((exportRecord: any) => (
              <TableRow key={exportRecord.id}>
                <TableCell className="font-medium">
                  {getExportTypeLabel(exportRecord.exportType)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFormatIcon(exportRecord.format)}
                    {exportRecord.format}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDateRange(
                    exportRecord.dateRangeStart,
                    exportRecord.dateRangeEnd
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(exportRecord.downloadedAt), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>{formatFileSize(exportRecord.fileSize)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exportRecord.id)}
                      disabled={deleteExportMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete export record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this export from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
