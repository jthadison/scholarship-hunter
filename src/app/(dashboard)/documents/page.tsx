/**
 * Document Vault Page
 * Story 4.1: Document Vault - Storage & Organization
 *
 * Main page for managing student documents
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Upload, FileText } from 'lucide-react'
import { DocumentUploadZone } from '@/components/document/DocumentUploadZone'
import { trpc } from '@/shared/lib/trpc'
import { DocumentType } from '@prisma/client'

export default function DocumentsPage() {
  const { userId } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<DocumentType | undefined>()
  const [showUpload, setShowUpload] = useState(false)

  // Get student profile
  const { data: student } = trpc.profile.get.useQuery(undefined, {
    enabled: !!userId,
  })

  // Get all documents
  const { data: documents, refetch } = trpc.document.getAll.useQuery(
    {
      studentId: student?.id ?? '',
      type: selectedType,
      search,
    },
    {
      enabled: !!student?.id,
    }
  )

  // Get storage usage
  const { data: storageUsage } = trpc.document.getStorageUsage.useQuery(
    {
      studentId: student?.id ?? '',
    },
    {
      enabled: !!student?.id,
    }
  )

  if (!student) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Vault</h1>
        <p className="text-muted-foreground">
          Manage all your scholarship application documents in one secure place
        </p>
      </div>

      {/* Storage Quota */}
      {storageUsage && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage Used</span>
                <span className="font-medium">
                  {(storageUsage.usedBytes / 1024 / 1024).toFixed(2)} MB /{' '}
                  {(storageUsage.quotaBytes / 1024 / 1024).toFixed(0)} MB
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    storageUsage.warningThreshold
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${storageUsage.percentageUsed}%` }}
                />
              </div>
              {storageUsage.warningThreshold && (
                <p className="text-sm text-yellow-600">
                  Warning: You're approaching your storage limit
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      {showUpload ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Add new documents to your vault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploadZone
              studentId={student.id}
              onUploadComplete={() => {
                refetch()
                setShowUpload(false)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-center">
          <Button onClick={() => setShowUpload(true)} size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      )}

      {/* Document List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Documents</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedType ?? 'ALL'}
            onValueChange={(value) =>
              setSelectedType((
                value === 'ALL' ? undefined : (value as DocumentType)
              )
            }
          >
            <TabsList className="mb-4">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="TRANSCRIPT">Transcripts</TabsTrigger>
              <TabsTrigger value="RESUME">Resumes</TabsTrigger>
              <TabsTrigger value="PERSONAL_STATEMENT">
                Personal Statements
              </TabsTrigger>
              <TabsTrigger value="FINANCIAL_DOCUMENT">Financial</TabsTrigger>
              <TabsTrigger value="OTHER">Other</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType ?? 'ALL'}>
              {!documents || documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No documents found</p>
                  <p className="text-sm text-muted-foreground">
                    Upload your first document to get started
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {(doc.fileSize / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <h3 className="font-medium truncate">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
