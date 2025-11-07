/**
 * Essay Editor Page (Story 4.7 - Completion)
 *
 * Main essay editing interface with quality assessment integration (Story 4.9)
 * This page ties together all essay editor components from Story 4.7
 *
 * @module app/dashboard/essays/[id]
 */

'use client'

import { useState, useCallback } from 'react'
import Head from 'next/head'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/shared/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, Sparkles, FileText } from 'lucide-react'
import { QualityAssessmentPanel } from '@/components/essay/quality'
import { EssayEditor } from '@/components/essay/EssayEditor'

export default function EssayEditorPage() {
  const params = useParams()
  const router = useRouter()
  const essayId = params?.id as string

  // Local state for editor content
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)

  // Fetch essay data
  const { data: essay, isLoading, error, refetch } = trpc.essay.getById.useQuery(
    { id: essayId },
    {
      enabled: !!essayId,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setContent(data.content || '')
        setWordCount(data.wordCount || 0)
      }
    }
  )

  // Update essay mutation
  const updateEssay = trpc.essay.update.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  // Handle content updates from editor
  const handleContentUpdate = useCallback((newContent: string, newWordCount: number) => {
    setContent(newContent)
    setWordCount(newWordCount)
  }, [])

  // Handle auto-save
  const handleAutoSave = useCallback(() => {
    if (content !== essay?.content) {
      updateEssay.mutate({
        id: essayId,
        content,
      })
    }
  }, [essayId, content, essay?.content, updateEssay])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-600" />
          <p className="mt-4 text-gray-600">Loading essay...</p>
        </div>
      </div>
    )
  }

  if (error || !essay) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-red-600">Essay Not Found</h2>
            <p className="mt-2 text-gray-600">
              The essay you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button
              onClick={() => router.push('/dashboard/essays/library')}
              className="mt-4 w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/essays/library')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Library
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{essay.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-500">
                    Phase: {essay.phase.replace('_', ' ').toLowerCase()}
                  </p>
                  <span className="text-gray-300">•</span>
                  <p className="text-sm text-gray-500">
                    {essay.wordCount} words
                  </p>
                  {essay.qualityScore && (
                    <>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm font-medium text-purple-600">
                        Quality: {essay.qualityScore}/100
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="editor">
              <FileText className="mr-2 h-4 w-4" />
              Essay Editor
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Sparkles className="mr-2 h-4 w-4" />
              Quality Assessment
            </TabsTrigger>
          </TabsList>

          {/* Essay Editor Tab */}
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>Write Your Essay</CardTitle>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-1">Essay Prompt:</p>
                  <p className="text-sm text-blue-800">{essay.prompt}</p>
                </div>
              </CardHeader>
              <CardContent>
                <EssayEditor
                  essayId={essayId}
                  content={content}
                  wordCount={wordCount}
                  onUpdate={handleContentUpdate}
                  onAutoSave={handleAutoSave}
                  placeholder="Start writing your essay here..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Assessment Tab (Story 4.9) */}
          <TabsContent value="quality">
            <QualityAssessmentPanel
              essayId={essayId}
              isFirstDraft={essay.version === 1}
            />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </>
  )
}
