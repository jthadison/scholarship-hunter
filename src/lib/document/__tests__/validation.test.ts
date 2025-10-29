/**
 * Tests for Document Compliance Validation Engine
 * Story 4.3: Document Compliance Validation
 *
 * Tests all validation scenarios:
 * - File format validation
 * - File size validation
 * - Naming pattern validation
 * - Combined validation scenarios
 * - Default requirements fallback
 */

import { describe, it, expect } from 'vitest'
import {
  validateDocument,
  getDocumentRequirements,
  validateDocuments,
  DEFAULT_DOCUMENT_REQUIREMENTS,
  ValidationErrorCode,
  type DocumentRequirementRule,
} from '../validation'
import { DocumentType } from '@prisma/client'

// Helper to create mock File objects
function createMockFile(
  name: string,
  type: string,
  sizeMB: number
): File {
  const sizeBytes = sizeMB * 1024 * 1024
  const blob = new Blob(['x'.repeat(sizeBytes)], { type })
  return new File([blob], name, { type })
}

describe('validateDocument', () => {
  describe('File Format Validation', () => {
    it('should pass validation for correct PDF format', () => {
      const file = createMockFile('transcript.pdf', 'application/pdf', 2)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for wrong format', () => {
      const file = createMockFile('transcript.jpg', 'image/jpeg', 2)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe(ValidationErrorCode.WRONG_FORMAT)
      expect(result.errors[0]?.message).toContain('PDF')
    })

    it('should pass validation for any allowed format', () => {
      const docxFile = createMockFile(
        'resume.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        2
      )
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        maxSizeMB: 5,
      }

      const result = validateDocument(docxFile, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('File Size Validation', () => {
    it('should pass validation for file within size limit', () => {
      const file = createMockFile('transcript.pdf', 'application/pdf', 3)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for file exceeding size limit', () => {
      const file = createMockFile('transcript.pdf', 'application/pdf', 12)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe(ValidationErrorCode.FILE_TOO_LARGE)
      expect(result.errors[0]?.message).toContain('10MB')
      expect(result.errors[0]?.message).toContain('12')
    })

    it('should pass validation for file exactly at size limit', () => {
      const file = createMockFile('transcript.pdf', 'application/pdf', 10)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Naming Pattern Validation', () => {
    it('should pass validation for matching naming pattern', () => {
      const file = createMockFile(
        'Doe_John_Transcript.pdf',
        'application/pdf',
        2
      )
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
        namingPattern: '^[A-Za-z]+_[A-Za-z]+_Transcript\\.pdf$',
        namingExample: 'LastName_FirstName_Transcript.pdf',
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for non-matching naming pattern', () => {
      const file = createMockFile('transcript.pdf', 'application/pdf', 2)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
        namingPattern: '^[A-Za-z]+_[A-Za-z]+_Transcript\\.pdf$',
        namingExample: 'LastName_FirstName_Transcript.pdf',
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.code).toBe(
        ValidationErrorCode.NAMING_PATTERN_MISMATCH
      )
      expect(result.errors[0]?.message).toContain('pattern')
    })

    it('should skip naming validation if no pattern specified', () => {
      const file = createMockFile('any-name.pdf', 'application/pdf', 2)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Combined Validation Scenarios', () => {
    it('should return multiple errors for multiple violations', () => {
      const file = createMockFile('wrong.jpg', 'image/jpeg', 15)
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
        namingPattern: '^[A-Za-z]+_[A-Za-z]+_Transcript\\.pdf$',
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(false)
      expect(result.errors).toHaveLength(3)

      const errorCodes = result.errors.map((e) => e.code)
      expect(errorCodes).toContain(ValidationErrorCode.WRONG_FORMAT)
      expect(errorCodes).toContain(ValidationErrorCode.FILE_TOO_LARGE)
      expect(errorCodes).toContain(
        ValidationErrorCode.NAMING_PATTERN_MISMATCH
      )
    })

    it('should pass validation when all criteria met', () => {
      const file = createMockFile(
        'Smith_Jane_Transcript.pdf',
        'application/pdf',
        5
      )
      const requirements: DocumentRequirementRule = {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 10,
        namingPattern: '^[A-Za-z]+_[A-Za-z]+_Transcript\\.pdf$',
      }

      const result = validateDocument(file, requirements)

      expect(result.compliant).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})

describe('getDocumentRequirements', () => {
  it('should return scholarship-specific requirements when provided', () => {
    const scholarshipRequirements = {
      TRANSCRIPT: {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 5,
        namingPattern: '^Transcript_.*\\.pdf$',
      },
    }

    const result = getDocumentRequirements(
      DocumentType.TRANSCRIPT,
      scholarshipRequirements
    )

    expect(result).toEqual(scholarshipRequirements.TRANSCRIPT)
  })

  it('should return default requirements when scholarship has none', () => {
    const result = getDocumentRequirements(DocumentType.TRANSCRIPT, null)

    expect(result).toEqual(DEFAULT_DOCUMENT_REQUIREMENTS.TRANSCRIPT)
  })

  it('should return default requirements for document type not in scholarship requirements', () => {
    const scholarshipRequirements = {
      TRANSCRIPT: {
        required: true,
        allowedFormats: ['application/pdf'],
        maxSizeMB: 5,
      },
    }

    const result = getDocumentRequirements(
      DocumentType.RESUME,
      scholarshipRequirements
    )

    expect(result).toEqual(DEFAULT_DOCUMENT_REQUIREMENTS.RESUME)
  })
})

describe('validateDocuments (batch)', () => {
  it('should validate multiple documents and return results map', () => {
    const transcriptFile = createMockFile(
      'transcript.pdf',
      'application/pdf',
      3
    )
    const resumeFile = createMockFile('resume.jpg', 'image/jpeg', 2) // Wrong format

    const files = [
      { file: transcriptFile, type: DocumentType.TRANSCRIPT },
      { file: resumeFile, type: DocumentType.RESUME },
    ]

    const results = validateDocuments(files, null)

    expect(results.size).toBe(2)

    const transcriptResult = results.get('transcript.pdf')
    expect(transcriptResult?.compliant).toBe(true)

    const resumeResult = results.get('resume.jpg')
    expect(resumeResult?.compliant).toBe(false)
    expect(resumeResult?.errors[0]?.code).toBe(
      ValidationErrorCode.WRONG_FORMAT
    )
  })
})

describe('DEFAULT_DOCUMENT_REQUIREMENTS', () => {
  it('should have requirements for all document types', () => {
    const allTypes = Object.values(DocumentType)

    allTypes.forEach((type) => {
      expect(DEFAULT_DOCUMENT_REQUIREMENTS[type]).toBeDefined()
      expect(DEFAULT_DOCUMENT_REQUIREMENTS[type]?.allowedFormats).toBeDefined()
      expect(DEFAULT_DOCUMENT_REQUIREMENTS[type]?.maxSizeMB).toBeGreaterThan(0)
    })
  })

  it('should have sensible default limits', () => {
    expect(DEFAULT_DOCUMENT_REQUIREMENTS.TRANSCRIPT.maxSizeMB).toBe(10)
    expect(DEFAULT_DOCUMENT_REQUIREMENTS.RESUME.maxSizeMB).toBe(5)
    expect(
      DEFAULT_DOCUMENT_REQUIREMENTS.TRANSCRIPT.allowedFormats
    ).toContain('application/pdf')
  })
})
