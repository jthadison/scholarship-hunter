import { describe, it, expect } from 'vitest'
import {
  documentCreateSchema,
} from '../../../src/lib/validations/document'

describe('Document Validation Schemas', () => {
  describe('documentCreateSchema', () => {
    it('should validate a complete valid document', () => {
      const validDocument = {
        studentId: 'clabcdef1234567890',
        applicationId: 'clxyz1234567890abc',
        name: 'High School Transcript',
        type: 'TRANSCRIPT',
        fileName: 'transcript-2024.pdf',
        fileSize: 1024000, // ~1MB
        mimeType: 'application/pdf',
        storagePath: 'students/cl123/documents/transcript.pdf',
        bucketName: 'documents',
        version: 1,
        compliant: true,
      }

      const result = documentCreateSchema.safeParse(validDocument)
      expect(result.success).toBe(true)
    })

    it('should validate document with only required fields', () => {
      const minimalDocument = {
        studentId: 'clabcdef1234567890',
        name: 'Resume',
        type: 'RESUME',
        fileName: 'resume.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        storagePath: 'students/cl123/resume.pdf',
        compliant: true,
      }

      const result = documentCreateSchema.safeParse(minimalDocument)
      expect(result.success).toBe(true)
    })

    describe('File size validation', () => {
      const maxSize = 10 * 1024 * 1024 // 10MB

      it('should accept file size of 1MB', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1024 * 1024,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept file size at 10MB limit', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: maxSize,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should reject file size above 10MB', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: maxSize + 1,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('fileSize')
        }
      })

      it('should reject zero file size', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 0,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })

      it('should reject negative file size', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: -1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })
    })

    describe('MIME type validation', () => {
      it('should accept PDF files', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept Word documents (.doc)', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'RESUME',
          fileName: 'test.doc',
          fileSize: 1000,
          mimeType: 'application/msword',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept Word documents (.docx)', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'RESUME',
          fileName: 'test.docx',
          fileSize: 1000,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept JPEG images', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'SUPPLEMENTAL_MATERIAL',
          fileName: 'test.jpg',
          fileSize: 1000,
          mimeType: 'image/jpeg',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept PNG images', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'SUPPLEMENTAL_MATERIAL',
          fileName: 'test.png',
          fileSize: 1000,
          mimeType: 'image/png',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept plain text files', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'OTHER',
          fileName: 'test.txt',
          fileSize: 1000,
          mimeType: 'text/plain',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should reject unsupported MIME types', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.exe',
          fileSize: 1000,
          mimeType: 'application/x-msdownload',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('mimeType')
        }
      })
    })

    describe('Compliance validation', () => {
      it('should accept compliant document without validation errors', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept non-compliant document with validation errors provided', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: false,
          validationErrors: {
            errors: ['Missing signature', 'Invalid format'],
          },
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should reject non-compliant document without validation errors', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: false,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('validationErrors')
        }
      })
    })

    describe('Enum validation', () => {
      it('should accept valid document type enum values', () => {
        const validTypes = [
          'TRANSCRIPT',
          'RESUME',
          'PERSONAL_STATEMENT',
          'FINANCIAL_DOCUMENT',
          'RECOMMENDATION_LETTER',
          'SUPPLEMENTAL_MATERIAL',
          'OTHER',
        ]

        validTypes.forEach((type) => {
          const document = {
            studentId: 'clabcdef1234567890',
            name: 'Test',
            type,
            fileName: 'test.pdf',
            fileSize: 1000,
            mimeType: 'application/pdf',
            storagePath: 'test/path',
            compliant: true,
          }
          const result = documentCreateSchema.safeParse(document)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid document type enum value', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'INVALID_TYPE',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })
    })

    describe('Required fields validation', () => {
      it('should reject missing studentId', () => {
        const document = {
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })

      it('should reject empty name', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: '',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })

      it('should reject empty fileName', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: '',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })

      it('should reject empty storagePath', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: '',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })
    })

    describe('Version control validation', () => {
      it('should accept version 1 (default)', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          version: 1,
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should accept higher version numbers with previousVersionId', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          version: 3,
          previousVersionId: 'clprev1234567890xyz',
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(true)
      })

      it('should reject version 0', () => {
        const document = {
          studentId: 'clabcdef1234567890',
          name: 'Test',
          type: 'TRANSCRIPT',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          storagePath: 'test/path',
          version: 0,
          compliant: true,
        }
        const result = documentCreateSchema.safeParse(document)
        expect(result.success).toBe(false)
      })
    })
  })
})
