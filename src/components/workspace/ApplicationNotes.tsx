/**
 * ApplicationNotes Component
 *
 * Rich text editor for application notes with auto-save functionality.
 * Auto-saves every 30 seconds with debounced input (500ms).
 *
 * Story 3.8 AC#3: Notes area with rich text editor and auto-save
 *
 * @module components/workspace/ApplicationNotes
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Loader2, Check, AlertCircle } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { CollapsibleCard } from './CollapsibleCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ApplicationNotesProps {
  /**
   * Application ID
   */
  applicationId: string

  /**
   * Initial notes content (HTML)
   */
  initialNotes?: string | null

  /**
   * Callback to save notes
   */
  onSave: (notes: string) => Promise<void>

  /**
   * Whether card is expanded
   */
  isExpanded: boolean

  /**
   * Toggle callback
   */
  onToggle: (id: string) => void

  /**
   * Additional CSS classes
   */
  className?: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function ApplicationNotes({
  initialNotes = '',
  onSave,
  isExpanded,
  onToggle,
  className,
}: ApplicationNotesProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [content, setContent] = useState(initialNotes || '')
  const [debouncedContent] = useDebounce(content, 500) // 500ms debounce

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialNotes || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] focus:outline-none p-4 rounded-lg border border-gray-200 dark:border-gray-700',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isExpanded) return // Don't auto-save if notes section is collapsed

    const interval = setInterval(async () => {
      if (debouncedContent !== initialNotes && debouncedContent) {
        try {
          setSaveStatus('saving')
          await onSave(debouncedContent)
          setSaveStatus('saved')
          setLastSaved(new Date())
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to auto-save notes:', error)
          setSaveStatus('error')
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [debouncedContent, initialNotes, onSave, isExpanded])

  // Manual save handler
  const handleManualSave = async () => {
    if (!debouncedContent) return

    try {
      setSaveStatus('saving')
      await onSave(debouncedContent)
      setSaveStatus('saved')
      setLastSaved(new Date())
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save notes:', error)
      setSaveStatus('error')
    }
  }

  // Save status indicator
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>
              Saved {lastSaved && `${Math.floor((Date.now() - lastSaved.getTime()) / 1000 / 60)} min ago`}
            </span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>Error saving</span>
            <Button size="sm" variant="ghost" onClick={handleManualSave}>
              Retry
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  if (!editor) {
    return null
  }

  return (
    <CollapsibleCard
      id="notes"
      title="Notes"
      subtitle="Strategy, reminders, and context"
      icon={<span className="text-lg">📝</span>}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-3">
        {/* Editor Toolbar */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && 'bg-gray-100 dark:bg-gray-800')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && 'bg-gray-100 dark:bg-gray-800')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-gray-100 dark:bg-gray-800')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && 'bg-gray-100 dark:bg-gray-800')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />

        {/* Save Status and Manual Save */}
        <div className="flex items-center justify-between">
          <SaveStatusIndicator />
          <Button size="sm" variant="outline" onClick={handleManualSave} disabled={saveStatus === 'saving'}>
            Save Now
          </Button>
        </div>

        {/* Helpful Tips */}
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Quick Tips</p>
          <ul className="mt-1 space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
            <li>• Use **bold** or *italic* for markdown shortcuts</li>
            <li>• Auto-saves every 30 seconds while editing</li>
            <li>• Track strategy, follow-up items, or questions for recommenders</li>
          </ul>
        </div>
      </div>
    </CollapsibleCard>
  )
}
