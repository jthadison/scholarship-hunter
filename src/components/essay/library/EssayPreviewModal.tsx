/**
 * EssayPreviewModal Component (Story 4.8 - Task 11)
 *
 * Full essay preview modal with quick actions
 * AC9: Shows full text, metadata, quick actions (view/clone/edit/delete)
 *
 * @module components/essay/library/EssayPreviewModal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Edit, Copy, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { trpc } from '@/shared/lib/trpc'
import { THEME_COLORS } from '@/server/services/essayThemeExtractor'

interface EssayPreviewModalProps {
  essayId: string
  isOpen: boolean
  onClose: () => void
  onRefetch: () => void
}

/**
 * Get theme color class based on theme name
 */
function getThemeColorClass(theme: string): string {
  const color = (THEME_COLORS as Record<string, string>)[theme] || 'gray'
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    teal: 'bg-teal-100 text-teal-800',
    orange: 'bg-orange-100 text-orange-800',
    gray: 'bg-gray-100 text-gray-800',
  }
  return colorMap[color] || colorMap['gray'] || 'bg-gray-100 text-gray-800'
}

/**
 * EssayPreviewModal Component
 * Read-only essay preview with quick actions
 */
export function EssayPreviewModal({ essayId, isOpen, onClose, onRefetch }: EssayPreviewModalProps) {
  const { data: essay, isLoading } = trpc.essay.getById.useQuery(
    { id: essayId },
    { enabled: isOpen }
  )

  const deleteEssayMutation = trpc.essay.delete.useMutation({
    onSuccess: () => {
      onRefetch()
      onClose()
    },
  })

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this essay? This action cannot be undone.')) {
      return
    }

    await deleteEssayMutation.mutateAsync({ id: essayId })
  }

  const handleEdit = () => {
    window.location.href = `/dashboard/essays/${essayId}`
  }

  const handleClone = async () => {
    alert('Clone & Adapt functionality coming soon!')
    // TODO: Implement clone functionality
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality coming soon!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="essay-preview-description">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {essay && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{essay.title}</DialogTitle>

              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground pt-2">
                {essay.application?.scholarship && (
                  <p>Scholarship: {essay.application.scholarship.name}</p>
                )}
                <p>Word Count: {essay.wordCount} words</p>
                <p>Completed: {format(new Date(essay.updatedAt), 'MMMM d, yyyy')}</p>
                {essay.qualityScore !== null && (
                  <p>Quality Score: {Math.round(essay.qualityScore)}/100</p>
                )}
              </div>

              {/* Themes */}
              {essay.themes && essay.themes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {essay.themes.map((theme) => (
                    <Badge key={theme} className={getThemeColorClass(theme)}>
                      {theme.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </DialogHeader>

            {/* Essay Content */}
            <div className="prose prose-sm max-w-none mt-6 p-6 bg-muted/30 rounded-lg" id="essay-preview-description" role="article">
              <div className="whitespace-pre-wrap">{essay.content}</div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t" role="group" aria-label="Essay actions">
              <Button variant="default" onClick={handleEdit} aria-label="Edit essay in editor">
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit in Editor
              </Button>

              <Button variant="outline" onClick={handleClone} aria-label="Clone and adapt essay">
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                Clone & Adapt
              </Button>

              <Button variant="outline" onClick={handleExportPDF} aria-label="Export essay as PDF">
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Export as PDF
              </Button>

              <div className="flex-1" />

              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteEssayMutation.isLoading}
                aria-label="Delete essay"
              >
                {deleteEssayMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Delete
              </Button>
            </div>

            {/* Navigation arrows placeholder */}
            {/* TODO: Implement previous/next navigation */}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
