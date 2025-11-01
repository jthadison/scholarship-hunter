/**
 * ExportButton Component
 *
 * Dropdown button for triggering exports from various pages.
 * Features:
 * - Dropdown menu with export options
 * - Opens ExportCenter modal
 * - Can be placed in dashboard headers
 *
 * Story: 5.9 - Export & Reporting (AC #1, #8)
 * @module components/exports/ExportButton
 */

"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, BarChart3, History } from "lucide-react";
import { ExportCenter } from "./ExportCenter";
import { useRouter } from "next/navigation";

interface ExportButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ExportButton({ variant = "outline", size = "default" }: ExportButtonProps) {
  const [exportCenterOpen, setExportCenterOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setExportCenterOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Applications List (CSV)</div>
              <div className="text-xs text-muted-foreground">
                Spreadsheet format
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setExportCenterOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Funding Summary (PDF)</div>
              <div className="text-xs text-muted-foreground">
                Awards report
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setExportCenterOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Analytics Report (PDF)</div>
              <div className="text-xs text-muted-foreground">
                Comprehensive metrics
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings?tab=exports")}>
            <History className="mr-2 h-4 w-4" />
            View Export History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportCenter open={exportCenterOpen} onClose={() => setExportCenterOpen(false)} />
    </>
  );
}
