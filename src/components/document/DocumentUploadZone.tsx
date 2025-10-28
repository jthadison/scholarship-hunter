/**
 * DocumentUploadZone Component
 * Story 4.1: Document Vault - Storage & Organization
 *
 * Drag-and-drop file upload component with:
 * - Drag-and-drop interface
 * - Click-to-browse fallback
 * - Upload progress indicators
 * - File validation (size, type)
 * - Batch upload support (up to 5 files)
 * - Category selection
 *
 * @component
 */

'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { DocumentType } from '@prisma/client'
import { trpc } from '@/shared/lib/trpc'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_BATCH_SIZE = 5

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface DocumentUploadZoneProps {
  studentId: string
  applicationId?: string
  onUploadComplete?: () => void
}

export function DocumentUploadZone({
  studentId,
  applicationId,
  onUploadComplete,
}: DocumentUploadZoneProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([])
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('')
  const { toast } = useToast()

  const uploadMutation = trpc.document.uploadDocument.useMutation({
    onSuccess: (_data, variables) => {
      const fileId = variables.fileName
      setUploadQueue((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'success', progress: 100 } : f
        )
      )
      toast({
        title: 'Upload successful',
        description: `${variables.name} has been uploaded.`,
      })
      onUploadComplete?.()
    },
    onError: (error, variables) => {
      const fileId = variables.fileName
      setUploadQueue((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      )
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      })
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validation
      if (!selectedType) {
        toast({
          variant: 'destructive',
          title: 'Category required',
          description: 'Please select a document category before uploading.',
        })
        return
      }

      if (acceptedFiles.length > MAX_BATCH_SIZE) {
        toast({
          variant: 'destructive',
          title: 'Too many files',
          description: `You can only upload up to ${MAX_BATCH_SIZE} files at once.`,
        })
        return
      }

      // Add files to queue
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}`,
        status: 'pending',
        progress: 0,
      }))

      setUploadQueue((prev) => [...prev, ...newFiles])

      // Start uploading
      newFiles.forEach((uploadFile) => {
        handleUpload(uploadFile)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedType, toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'text/plain': ['.txt'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const handleUpload = async (uploadFile: UploadFile) => {
    if (!selectedType) return

    const { file, id } = uploadFile

    // Update status to uploading
    setUploadQueue((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'uploading' } : f))
    )

    // Convert file to base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Data = reader.result?.toString().split(',')[1]
      if (!base64Data) {
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: 'error', error: 'Failed to read file' }
              : f
          )
        )
        return
      }

      // Upload
      await uploadMutation.mutateAsync({
        studentId,
        applicationId,
        name: file.name,
        type: selectedType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileData: base64Data,
      })
    }

    reader.onerror = () => {
      setUploadQueue((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: 'error', error: 'Failed to read file' }
            : f
        )
      )
    }

    reader.readAsDataURL(file)
  }

  const removeFile = (id: string) => {
    setUploadQueue((prev) => prev.filter((f) => f.id !== id))
  }

  const clearCompleted = () => {
    setUploadQueue((prev) =>
      prev.filter((f) => f.status !== 'success' && f.status !== 'error')
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Document Category:</label>
        <Select
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as DocumentType)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRANSCRIPT">Transcript</SelectItem>
            <SelectItem value="RESUME">Resume</SelectItem>
            <SelectItem value="PERSONAL_STATEMENT">Personal Statement</SelectItem>
            <SelectItem value="FINANCIAL_DOCUMENT">
              Financial Document
            </SelectItem>
            <SelectItem value="RECOMMENDATION_LETTER">
              Recommendation Letter
            </SelectItem>
            <SelectItem value="SUPPLEMENTAL_MATERIAL">
              Supplemental Material
            </SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dropzone */}
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              !selectedType && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} disabled={!selectedType} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive
                ? 'Drop files here'
                : 'Drag and drop files here, or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOC, DOCX, JPG, PNG, GIF, TXT (max 10MB per file, up
              to 5 files at once)
            </p>
            {!selectedType && (
              <p className="text-sm text-destructive mt-2">
                Please select a category first
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Upload Queue</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              disabled={
                !uploadQueue.some(
                  (f) => f.status === 'success' || f.status === 'error'
                )
              }
            >
              Clear Completed
            </Button>
          </div>

          {uploadQueue.map((uploadFile) => (
            <Card key={uploadFile.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-2" />
                    )}
                    {uploadFile.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>
                  {uploadFile.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {(uploadFile.status === 'pending' ||
                    uploadFile.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
