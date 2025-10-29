/**
 * Recommendation Request Modal
 *
 * Form for requesting a recommendation letter from a recommender.
 * Generates templated email with unique upload link and sends via email service.
 *
 * Story 4.4: Recommendation Letter Coordination
 * AC1: Recommendation request form
 * AC2: Templated email generation
 *
 * @module components/recommendations/RecommendationRequestModal
 */

'use client'

import React, { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Mail, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RecommendationRequestModalProps {
  applicationId: string
  scholarshipName: string
  deadline: Date
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const RELATIONSHIPS = [
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Counselor', label: 'Counselor' },
  { value: 'Coach', label: 'Coach' },
  { value: 'Employer', label: 'Employer' },
  { value: 'Mentor', label: 'Mentor' },
  { value: 'Other', label: 'Other' },
]

export function RecommendationRequestModal({
  applicationId,
  scholarshipName,
  deadline,
  isOpen,
  onClose,
  onSuccess,
}: RecommendationRequestModalProps) {
  const [formData, setFormData] = useState({
    recommenderName: '',
    recommenderEmail: '',
    relationship: '',
    personalMessage: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const utils = trpc.useUtils()
  const createRecommendation = trpc.recommendation.create.useMutation({
    onSuccess: () => {
      toast.success('Recommendation request sent successfully!')
      utils.recommendation.getByApplication.invalidate({ applicationId })
      utils.application.getWorkspaceData.invalidate({ applicationId })
      handleClose()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Failed to send request: ${error.message}`)
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.recommenderName.trim()) {
      newErrors.recommenderName = 'Recommender name is required'
    }

    if (!formData.recommenderEmail.trim()) {
      newErrors.recommenderEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recommenderEmail)) {
      newErrors.recommenderEmail = 'Invalid email address'
    }

    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await createRecommendation.mutateAsync({
      applicationId,
      recommenderName: formData.recommenderName.trim(),
      recommenderEmail: formData.recommenderEmail.trim().toLowerCase(),
      relationship: formData.relationship,
      personalMessage: formData.personalMessage.trim() || undefined,
    })
  }

  const handleClose = () => {
    setFormData({
      recommenderName: '',
      recommenderEmail: '',
      relationship: '',
      personalMessage: '',
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Request Recommendation Letter</DialogTitle>
          <DialogDescription>
            Send a request email to your recommender with an upload link for <strong>{scholarshipName}</strong>.
            Deadline: {deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recommender Name */}
          <div className="space-y-2">
            <Label htmlFor="recommenderName">
              Recommender Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recommenderName"
              placeholder="e.g., Dr. Jane Smith"
              value={formData.recommenderName}
              onChange={(e) =>
                setFormData({ ...formData, recommenderName: e.target.value })
              }
              className={errors.recommenderName ? 'border-red-500' : ''}
            />
            {errors.recommenderName && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recommenderName}
              </p>
            )}
          </div>

          {/* Recommender Email */}
          <div className="space-y-2">
            <Label htmlFor="recommenderEmail">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recommenderEmail"
              type="email"
              placeholder="e.g., jane.smith@school.edu"
              value={formData.recommenderEmail}
              onChange={(e) =>
                setFormData({ ...formData, recommenderEmail: e.target.value })
              }
              className={errors.recommenderEmail ? 'border-red-500' : ''}
            />
            {errors.recommenderEmail && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recommenderEmail}
              </p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor="relationship">
              Relationship <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) =>
                setFormData({ ...formData, relationship: value })
              }
            >
              <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.relationship && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.relationship}
              </p>
            )}
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="personalMessage">
              Personal Message <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="personalMessage"
              placeholder="Add a personal note to your recommender explaining why you're asking them..."
              value={formData.personalMessage}
              onChange={(e) =>
                setFormData({ ...formData, personalMessage: e.target.value })
              }
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This message will be included in the email sent to your recommender.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRecommendation.isPending}>
              {createRecommendation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
