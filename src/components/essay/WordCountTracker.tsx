"use client";

/**
 * Word Count Tracker Component
 * Story 4.7 - AC9: Word Count Tracker with Target Range
 *
 * Real-time word count display with color-coded indicators
 * based on target range (green/yellow/red)
 */

interface WordCountTrackerProps {
  current: number;
  targetMin: number;
  targetMax: number;
  showCharCount?: boolean;
}

export function WordCountTracker({
  current,
  targetMin,
  targetMax,
  showCharCount = false,
}: WordCountTrackerProps) {
  // Determine status and color
  const getStatus = () => {
    if (current < targetMin) {
      const remaining = targetMin - current;
      if (current < targetMin * 0.5) {
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          message: `${remaining} words to minimum`,
        };
      }
      return {
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        message: `${remaining} words to minimum`,
      };
    }

    if (current > targetMax) {
      const over = current - targetMax;
      return {
        color: "text-red-700",
        bgColor: "bg-red-50",
        message: `${over} words over limit`,
      };
    }

    // Within range - check if approaching limit
    const threshold = targetMax * 0.9;
    if (current >= threshold) {
      const remaining = targetMax - current;
      return {
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        message: `${remaining} words remaining`,
      };
    }

    // Perfect range
    return {
      color: "text-green-700",
      bgColor: "bg-green-50",
      message: "Within target range",
    };
  };

  const status = getStatus();

  return (
    <div className="flex items-center gap-4">
      {/* Word Count Display */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${status.bgColor}`}
      >
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-semibold ${status.color}`}>
            {current}
          </span>
          <span className="text-sm text-gray-600">words</span>
        </div>

        <div className="h-4 w-px bg-gray-300" />

        <div className="text-xs text-gray-600">
          Target: {targetMin}-{targetMax}
        </div>
      </div>

      {/* Status Message */}
      <div className={`text-sm ${status.color}`}>{status.message}</div>
    </div>
  );
}
