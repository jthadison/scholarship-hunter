/**
 * Type definitions for Export functionality
 * Story 5.9: Export & Reporting
 */

export interface ExportOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  privacySettings?: {
    excludePersonalInfo?: boolean;
    excludeSensitiveDetails?: boolean;
  };
}

export interface DateRangePreset {
  label: string;
  value: string;
  getRange: () => { start: Date; end: Date };
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: "All time",
    value: "all",
    getRange: () => {
      const now = new Date();
      const past = new Date(2020, 0, 1); // January 1, 2020
      return { start: past, end: now };
    },
  },
  {
    label: "This year",
    value: "this-year",
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    },
  },
  {
    label: "Last 6 months",
    value: "6-months",
    getRange: () => {
      const now = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      return { start, end: now };
    },
  },
  {
    label: "Last 3 months",
    value: "3-months",
    getRange: () => {
      const now = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return { start, end: now };
    },
  },
  {
    label: "Last 30 days",
    value: "30-days",
    getRange: () => {
      const now = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { start, end: now };
    },
  },
];
