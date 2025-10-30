/**
 * New Essay Page (Story 4.6 - Task 12)
 *
 * Essay creation page with prompt input and AI analysis
 * AC1: Student pastes essay prompt or system pulls from scholarship data
 *
 * @module app/dashboard/essays/new
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { PromptAnalysisPanel } from '@/components/essay/prompt-analysis'
import { trpc } from '@/shared/lib/trpc'
import type { PromptAnalysis } from '@/types/essay'

/**
 * New Essay Creation Page
 * AC1, AC2: Prompt input and analysis
 */
export default function NewEssayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams?.get('applicationId')

  const [step, setStep] = useState<'input' | 'analysis' | 'create'>('input')
  const [title, setTitle] = useState('')
  const [promptText, setPromptText] = useState('')
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)
  const [studentId, setStudentId] = useState('') // In real app, get from auth context

  // tRPC mutations
  const analyzePromptMutation = trpc.essay.analyzePrompt.useMutation()
  const createEssayMutation = trpc.essay.create.useMutation()

  const handleAnalyzePrompt = async () => {
    if (!promptText || promptText.length < 10) {
      alert('Please enter a prompt (at least 10 characters)')
      return
    }

    try {
      const result = await analyzePromptMutation.mutateAsync({
        promptText,
      })
      setAnalysis(result)
      setStep('analysis')
    } catch (error) {
      console.error('Failed to analyze prompt:', error)
      alert('Failed to analyze prompt. Please try again.')
    }
  }

  const handleCreateEssay = async () => {
    if (!title || !promptText || !studentId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const essay = await createEssayMutation.mutateAsync({
        studentId,
        title,
        prompt: promptText,
        applicationId: applicationId ?? undefined,
        analyzePromptImmediately: true,
      })

      // Navigate to essay editor (Story 4.7)
      router.push(`/dashboard/essays/${essay.id}`)
    } catch (error) {
      console.error('Failed to create essay:', error)
      alert('Failed to create essay. Please try again.')
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Essay</h1>
        <p className="text-gray-600 mt-2">
          Enter your essay prompt and Morgan will analyze it to help you write a winning response!
        </p>
      </div>

      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Essay Details</CardTitle>
            <CardDescription>
              Provide your essay title and prompt to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student ID (temporary - should come from auth) */}
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID (temporary)</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
              />
              <p className="text-xs text-gray-500">
                In production, this will be auto-filled from your profile
              </p>
            </div>

            {/* Essay Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Essay Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Leadership Experience Essay"
              />
            </div>

            {/* Essay Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Essay Prompt</Label>
              <Textarea
                id="prompt"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Paste the scholarship essay prompt here..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Minimum 10 characters required
              </p>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyzePrompt}
              disabled={analyzePromptMutation.isLoading || promptText.length < 10}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {analyzePromptMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Morgan is analyzing your prompt...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Prompt with Morgan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'analysis' && analysis && (
        <div className="space-y-6">
          {/* Analysis Results */}
          <PromptAnalysisPanel analysis={analysis} promptText={promptText} />

          {/* Create Essay Button */}
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Ready to start writing?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Create your essay and use Morgan's guidance throughout the writing process
                  </p>
                </div>
                <Button
                  onClick={handleCreateEssay}
                  disabled={createEssayMutation.isLoading}
                  className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
                >
                  {createEssayMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Essay'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setStep('input')}
            className="w-full"
          >
            ← Back to Edit Prompt
          </Button>
        </div>
      )}
    </div>
  )
}
