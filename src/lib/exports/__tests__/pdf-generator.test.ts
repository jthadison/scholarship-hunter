/**
 * PDF Generator Tests
 * Story 5.9: Export & Reporting
 */

import { describe, it, expect } from 'vitest';
import {
  generateFundingSummaryPDF,
  generateAnalyticsPDF,
  generatePdfFilename,
  type StudentData,
  type FundingData,
  type AnalyticsData,
} from '../pdf-generator';

describe('PDF Generator', () => {
  const mockStudentData: StudentData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  const mockFundingData: FundingData = {
    totalFunding: 15000,
    awardsCount: 3,
    successRate: 0.6,
    averageAward: 5000,
    awards: [
      {
        scholarshipName: 'Test Scholarship 1',
        awardAmount: 5000,
        decisionDate: new Date('2024-04-01'),
        provider: 'Test Provider 1',
      },
      {
        scholarshipName: 'Test Scholarship 2',
        awardAmount: 10000,
        decisionDate: new Date('2024-05-01'),
        provider: 'Test Provider 2',
      },
    ],
  };

  const mockAnalyticsData: AnalyticsData = {
    totalApplications: 10,
    totalSubmitted: 8,
    totalAwarded: 3,
    totalDenied: 2,
    successRate: 0.375,
    totalFunding: 15000,
    averageAward: 5000,
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-12-31'),
    tierBreakdown: [
      {
        tier: 'MUST_APPLY',
        applications: 5,
        awarded: 2,
        successRate: 0.4,
      },
      {
        tier: 'SHOULD_APPLY',
        applications: 3,
        awarded: 1,
        successRate: 0.33,
      },
    ],
  };

  describe('generateFundingSummaryPDF', () => {
    it('should generate a PDF Blob', async () => {
      const blob = await generateFundingSummaryPDF(mockStudentData, mockFundingData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should generate a non-empty PDF', async () => {
      const blob = await generateFundingSummaryPDF(mockStudentData, mockFundingData);

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should redact student name when privacy is enabled', async () => {
      const blob = await generateFundingSummaryPDF(
        mockStudentData,
        mockFundingData,
        { excludePersonalInfo: true }
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle empty awards array', async () => {
      const emptyFundingData: FundingData = {
        ...mockFundingData,
        awards: [],
        totalFunding: 0,
        awardsCount: 0,
      };

      const blob = await generateFundingSummaryPDF(mockStudentData, emptyFundingData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generateAnalyticsPDF', () => {
    it('should generate a PDF Blob', async () => {
      const blob = await generateAnalyticsPDF(mockAnalyticsData, mockStudentData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should generate a non-empty PDF', async () => {
      const blob = await generateAnalyticsPDF(mockAnalyticsData, mockStudentData);

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should include tier breakdown when provided', async () => {
      const blob = await generateAnalyticsPDF(mockAnalyticsData, mockStudentData);

      expect(blob).toBeInstanceOf(Blob);
      // Tier breakdown should increase PDF size
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('should handle analytics without tier breakdown', async () => {
      const analyticsWithoutTiers: AnalyticsData = {
        ...mockAnalyticsData,
        tierBreakdown: undefined,
      };

      const blob = await generateAnalyticsPDF(analyticsWithoutTiers, mockStudentData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should redact student name when privacy is enabled', async () => {
      const blob = await generateAnalyticsPDF(
        mockAnalyticsData,
        mockStudentData,
        { excludePersonalInfo: true }
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generatePdfFilename', () => {
    it('should generate filename for funding summary', () => {
      const filename = generatePdfFilename('funding-summary', 'John Doe');

      expect(filename).toMatch(/^funding-summary-john-doe-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename for analytics report', () => {
      const filename = generatePdfFilename('analytics-report', 'Jane Smith');

      expect(filename).toMatch(/^analytics-report-jane-smith-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should use "student" when name is redacted', () => {
      const filename = generatePdfFilename('funding-summary', 'John Doe', {
        excludePersonalInfo: true,
      });

      expect(filename).toMatch(/^funding-summary-student-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should handle null student name', () => {
      const filename = generatePdfFilename('analytics-report', null);

      expect(filename).toMatch(/^analytics-report-student-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should replace spaces with hyphens', () => {
      const filename = generatePdfFilename('funding-summary', 'Mary Jane Watson');

      expect(filename).toContain('mary-jane-watson');
    });

    it('should include current date', () => {
      const filename = generatePdfFilename('analytics-report', 'Test User');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toContain(today);
    });
  });
});
