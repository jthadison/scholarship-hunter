/**
 * CSV Generator Tests
 * Story 5.9: Export & Reporting
 */

import { describe, it, expect } from 'vitest';
import {
  generateApplicationsCSV,
  generateApplicationsCsvBlob,
  generateCsvFilename,
  type ApplicationWithDetails,
} from '../csv-generator';

describe('CSV Generator', () => {
  const mockApplications: ApplicationWithDetails[] = [
    {
      id: '1',
      studentId: 'student1',
      scholarshipId: 'sch1',
      status: 'SUBMITTED',
      dateAdded: new Date('2024-01-15'),
      scholarship: {
        id: 'sch1',
        name: 'Test Scholarship',
        provider: 'Test Provider',
        awardAmount: 5000,
        deadline: new Date('2024-03-01'),
      },
      outcome: {
        id: 'out1',
        studentId: 'student1',
        applicationId: '1',
        result: 'AWARDED',
        awardAmountReceived: 5000,
        decisionDate: new Date('2024-04-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        feedback: null,
        notes: null,
      },
    } as any,
    {
      id: '2',
      studentId: 'student1',
      scholarshipId: 'sch2',
      status: 'IN_PROGRESS',
      dateAdded: new Date('2024-02-01'),
      scholarship: {
        id: 'sch2',
        name: 'Scholarship with, Comma',
        provider: 'Provider "Quoted"',
        awardAmount: 10000,
        deadline: new Date('2024-05-01'),
      },
      outcome: null,
    } as any,
  ];

  describe('generateApplicationsCSV', () => {
    it('should generate CSV with correct headers', () => {
      const csv = generateApplicationsCSV(mockApplications);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Scholarship Name,Provider,Award Amount,Deadline,Application Status,Outcome,Date Applied,Award Received,Decision Date');
    });

    it('should format data correctly', () => {
      const csv = generateApplicationsCSV(mockApplications);
      const lines = csv.split('\n');

      // Check first application (with outcome)
      expect(lines[1]).toContain('Test Scholarship');
      expect(lines[1]).toContain('Test Provider');
      expect(lines[1]).toContain('5000');
      expect(lines[1]).toContain('SUBMITTED');
      expect(lines[1]).toContain('AWARDED');
    });

    it('should handle special characters in scholarship names', () => {
      const csv = generateApplicationsCSV(mockApplications);
      const lines = csv.split('\n');

      // Should escape comma in scholarship name
      expect(lines[2]).toContain('"Scholarship with, Comma"');
      // Should escape quotes in provider name
      expect(lines[2]).toContain('"Provider ""Quoted"""');
    });

    it('should handle null outcome data', () => {
      const csv = generateApplicationsCSV(mockApplications);
      const lines = csv.split('\n');

      // Second application has no outcome
      expect(lines[2]).toContain('PENDING');
      expect(lines[2]).toContain(',,'); // Empty award received and decision date
    });

    it('should format dates as YYYY-MM-DD', () => {
      const csv = generateApplicationsCSV(mockApplications);
      const lines = csv.split('\n');

      // Check that dates are in YYYY-MM-DD format (testing pattern, not exact dates due to timezone)
      expect(lines[1]).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(lines[1]).toContain('SUBMITTED');
      expect(lines[1]).toContain('AWARDED');
    });

    it('should redact data when excludeSensitiveDetails is true', () => {
      const csv = generateApplicationsCSV(mockApplications, {
        excludeSensitiveDetails: true,
      });
      const lines = csv.split('\n');

      expect(lines[1]).toContain('[REDACTED]');
      expect(lines[1]).not.toContain('Test Scholarship');
    });

    it('should handle empty applications array', () => {
      const csv = generateApplicationsCSV([]);
      const lines = csv.split('\n');

      expect(lines.length).toBe(1); // Only header row
      expect(lines[0]).toContain('Scholarship Name');
    });
  });

  describe('generateApplicationsCsvBlob', () => {
    it('should create a Blob with correct MIME type', () => {
      const blob = generateApplicationsCsvBlob(mockApplications);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should contain CSV data', () => {
      const blob = generateApplicationsCsvBlob(mockApplications);

      // Verify blob was created
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generateCsvFilename', () => {
    it('should generate filename with student name', () => {
      const filename = generateCsvFilename('John Doe');

      expect(filename).toMatch(/^scholarship-applications-john-doe-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should use "student" when name is redacted', () => {
      const filename = generateCsvFilename('John Doe', {
        excludePersonalInfo: true,
      });

      expect(filename).toMatch(/^scholarship-applications-student-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should handle null student name', () => {
      const filename = generateCsvFilename(null);

      expect(filename).toMatch(/^scholarship-applications-student-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should replace spaces with hyphens', () => {
      const filename = generateCsvFilename('Jane Mary Smith');

      expect(filename).toContain('jane-mary-smith');
    });

    it('should include current date', () => {
      const filename = generateCsvFilename('Test User');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toContain(today);
    });
  });
});
