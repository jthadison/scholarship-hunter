"use client";

/**
 * Auto-Save Indicator Component
 * Story 4.7 - Auto-save status display
 *
 * Shows save status: "Saving...", "Saved", or "Save Now" button
 */

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { Button } from "../ui/button";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status?: SaveStatus;
  lastSaved?: Date | null;
  onManualSave?: () => void;
}

export function AutoSaveIndicator({
  status = "idle",
  lastSaved = null,
  onManualSave,
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Update "time ago" display every minute
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo("");
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins === 0) {
        setTimeAgo("just now");
      } else if (diffMins === 1) {
        setTimeAgo("1 minute ago");
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        setTimeAgo(hours === 1 ? "1 hour ago" : `${hours} hours ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSaved]);

  return (
    <div className="flex items-center gap-3">
      {/* Status Indicator */}
      <div className="flex items-center gap-1.5 text-sm">
        {status === "saving" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            <span className="text-gray-600">Saving...</span>
          </>
        )}

        {status === "saved" && lastSaved && (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">
              Saved <span className="text-gray-500">{timeAgo}</span>
            </span>
          </>
        )}

        {status === "error" && (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-600">Save failed</span>
          </>
        )}
      </div>

      {/* Manual Save Button */}
      {onManualSave && (
        <Button
          variant="outline"
          size="sm"
          onClick={onManualSave}
          disabled={status === "saving"}
          className="text-xs"
        >
          <Save className="h-3 w-3 mr-1" />
          Save Now
        </Button>
      )}
    </div>
  );
}
