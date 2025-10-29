/**
 * Recommendation Upload Form (Public)
 *
 * Form for recommenders to upload their letter via upload token.
 * Validates token, handles file upload to Supabase, creates Document record.
 *
 * Story 4.4: Recommendation Letter Coordination
 * AC6: Public upload endpoint with token validation
 *
 * @module components/recommendations/RecommendationUploadForm
 */

'use client'

import React, { useState, useEffect } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
// Note: Supabase upload handled via API route, not direct client upload

interface RecommendationUploadFormProps {
  token: string
}

export function RecommendationUploadForm({ token }: RecommendationUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  // Note: For public upload, we'll need to handle Supabase differently
  // This is a placeholder - actual implementation will depend on your Supabase setup
  const uploadToSupabase = async (file: File): Promise<string> => {
    // TODO: Implement direct Supabase upload for public access
    // For now, return a placeholder
    const formData = new FormData()
    formData.append('file', file)

    // This would be a direct upload to Supabase Storage
    // using the public bucket with appropriate RLS policies
    const response = await fetch('/api/upload-recommendation', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload file')
    }

    const data = await response.json()
    return data.fileUrl
  }

  const uploadRecommendation = trpc.recommendation.uploadByToken.useMutation({
    onSuccess: () => {
      setUploadSuccess(true)
      toast.success('Recommendation letter uploaded successfully!')
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`)
      setIsUploading(false)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PDF or DOCX file')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      toast.error('File size must not exceed 10MB')
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    if (token.length !== 64) {
      toast.error('Invalid upload token')
      return
    }

    setIsUploading(true)

    try {
      // Step 1: Upload file to Supabase Storage
      const uploadedFileUrl = await uploadToSupabase(file)
      setFileUrl(uploadedFileUrl)

      // Step 2: Update recommendation record via tRPC
      await uploadRecommendation.mutateAsync({
        token,
        fileUrl: uploadedFileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        message: message.trim() || undefined,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload recommendation letter')
      setIsUploading(false)
    }
  }

  if (uploadSuccess) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Upload Successful!</CardTitle>
          <CardDescription>
            Your recommendation letter has been successfully submitted. Thank you for your support!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The student has been notified that you've submitted your letter. You may now close this page.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Upload Recommendation Letter</CardTitle>
        <CardDescription>
          Please upload your recommendation letter as a PDF or DOCX file (maximum 10MB).
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">
              Recommendation Letter <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" />
                      <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{file.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PDF or DOCX (MAX. 10MB)</p>
                    </>
                  )}
                </div>
                <input
                  id="file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message to Student <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a brief message if you'd like..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isUploading}
            />
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Secure Upload</p>
                <p className="text-blue-700 dark:text-blue-300">
                  This upload link is unique and can only be used once. Your letter will be securely stored and only accessible to the student and scholarship administrators.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Submit Recommendation Letter
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
