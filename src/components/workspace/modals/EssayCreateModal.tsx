/**
 * EssayCreateModal Component
 *
 * Modal for creating a new essay for an application.
 * Collects essay title and prompt, then creates the essay record.
 *
 * Story 3.8 AC#2: Quick action modals for essay creation
 *
 * @module components/workspace/modals/EssayCreateModal
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/shared/lib/trpc'
import { toast } from 'sonner'

interface EssayCreateModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean

  /**
   * Callback to close the modal
   */
  onClose: () => void

  /**
   * Application ID
   */
  applicationId: string

  /**
   * Student ID (from auth context)
   */
  studentId: string

  /**
   * Callback after successful creation
   */
  onSuccess?: () => void
}

export function EssayCreateModal({
  isOpen,
  onClose,
  applicationId,
  studentId,
  onSuccess,
}: EssayCreateModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')

  // Create essay mutation
  const createEssay = trpc.essay.create.useMutation({
    onSuccess: (essay) => {
      toast.success('Essay created successfully')

      // Reset form
      setTitle('')
      setPrompt('')

      // Call success callback
      onSuccess?.()

      // Navigate to essay editor FIRST (before closing modal)
      // This ensures the navigation starts before the component unmounts
      router.push(`/dashboard/essays/${essay.id}`)

      // Close modal after a short delay to ensure navigation has started
      setTimeout(() => {
        onClose()
      }, 100)
    },
    onError: (error) => {
      toast.error(`Failed to create essay: ${error.message}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim()) {
      toast.error('Please enter an essay title')
      return
    }

    if (!prompt.trim()) {
      toast.error('Please enter the essay prompt')
      return
    }

    if (prompt.length < 10) {
      toast.error('Essay prompt must be at least 10 characters')
      return
    }

    // Debug: Log the studentId being sent
    console.log('Creating essay with studentId:', studentId, 'type:', typeof studentId)

    // Create essay
    await createEssay.mutateAsync({
      studentId,
      title: title.trim(),
      prompt: prompt.trim(),
      applicationId,
      analyzePromptImmediately: false, // Don't analyze on creation
    })
  }

  const handleClose = () => {
    if (createEssay.isPending) {
      // Don't close while creating
      return
    }

    // Reset form
    setTitle('')
    setPrompt('')

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Essay</DialogTitle>
          <DialogDescription>
            Create a new essay for this application. You can enter the essay prompt and start working on your response.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Essay Title */}
          <div>
            <Label htmlFor="essay-title">Essay Title</Label>
            <Input
              id="essay-title"
              type="text"
              placeholder="e.g., Personal Statement, Why This School, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createEssay.isPending}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Give this essay a descriptive title to help you identify it
            </p>
          </div>

          {/* Essay Prompt */}
          <div>
            <Label htmlFor="essay-prompt">Essay Prompt</Label>
            <Textarea
              id="essay-prompt"
              placeholder="Paste the essay prompt or question from the scholarship application..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={createEssay.isPending}
              rows={6}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The AI will analyze this prompt to help guide your writing
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createEssay.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEssay.isPending || !title.trim() || !prompt.trim()}
            >
              {createEssay.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Essay'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
