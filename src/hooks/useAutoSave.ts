/**
 * Auto-Save Hook
 * Story 4.7 - AC10: Auto-Save and Version History
 *
 * Debounced auto-save with status tracking
 */

import { useEffect, useRef, useCallback, useState } from "react";
import debounce from "lodash.debounce";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  lastSaved: Date | null;
  manualSave: () => Promise<void>;
  triggerSave: () => void;
}

/**
 * Auto-save hook with debouncing
 *
 * @param options - Configuration options
 * @returns Auto-save state and controls
 *
 * @example
 * const { status, lastSaved, manualSave, triggerSave } = useAutoSave({
 *   onSave: async () => {
 *     await api.updateEssay({ id, content });
 *   },
 *   delay: 10000, // 10 seconds
 * });
 *
 * // Call triggerSave() when content changes
 * // Status will be: idle → saving → saved
 */
export function useAutoSave({
  onSave,
  delay = 10000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manual save function (called by "Save Now" button)
  const manualSave = useCallback(async () => {
    if (!enabled) return;

    setStatus("saving");
    try {
      await onSave();
      setStatus("saved");
      setLastSaved(new Date());

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Manual save failed:", error);
      setStatus("error");

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    }
  }, [enabled, onSave]);

  // Debounced save function (called automatically after delay)
  const debouncedSave = useCallback(
    debounce(async () => {
      if (!enabled) return;

      setStatus("saving");
      try {
        await onSave();
        setStatus("saved");
        setLastSaved(new Date());

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setStatus("idle");
        }, 3000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setStatus("error");

        // Reset to idle after 5 seconds
        setTimeout(() => {
          setStatus("idle");
        }, 5000);
      }
    }, delay),
    [enabled, onSave, delay]
  );

  // Trigger save (called when content changes)
  const triggerSave = useCallback(() => {
    if (!enabled) return;

    // Cancel any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Show "Saving..." immediately when user stops typing
    setStatus("idle"); // Keep as idle until debounce completes

    // Trigger debounced save
    debouncedSave();
  }, [enabled, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedSave]);

  return {
    status,
    lastSaved,
    manualSave,
    triggerSave,
  };
}
