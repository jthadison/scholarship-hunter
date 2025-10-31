/**
 * Goal Creation Modal
 *
 * Form for creating a new profile improvement goal.
 * Supports creating from gap analysis recommendations or custom goals.
 * Shows estimated impact on profile strength.
 *
 * Story 5.4: Profile Improvement Tracker
 * AC1: Goal-setting interface
 * AC2: Goal types supported
 * AC6: Impact updates
 *
 * @module components/goals/GoalCreationModal
 */

'use client'

import React, { useState, useEffect } from 'react'
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
import { Loader2, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { GoalType } from '@prisma/client'
import {
  calculateGoalImpact,
  getGoalValueUnit,
  getSuggestedTimeline,
} from '@/lib/goals/impact-calculator'
import { addMonths, format } from 'date-fns'

interface GoalCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  fromGapAnalysis?: {
    goalType: GoalType
    targetValue: number
    currentValue?: number
    notes?: string
  }
}

const GOAL_TYPES = [
  { value: GoalType.GPA_IMPROVEMENT, label: 'GPA Improvement' },
  { value: GoalType.VOLUNTEER_HOURS, label: 'Volunteer Hours' },
  { value: GoalType.LEADERSHIP_POSITION, label: 'Leadership Position' },
  { value: GoalType.EXTRACURRICULAR, label: 'Extracurricular Activity' },
  { value: GoalType.TEST_SCORE, label: 'Test Score' },
  { value: GoalType.CUSTOM, label: 'Custom Goal' },
]

const QUICK_GOALS = [
  {
    label: 'Reach 100 volunteer hours',
    goalType: GoalType.VOLUNTEER_HOURS,
    targetValue: 100,
  },
  {
    label: 'Earn 1500+ SAT score',
    goalType: GoalType.TEST_SCORE,
    targetValue: 1500,
  },
  {
    label: 'Join 2 new clubs',
    goalType: GoalType.EXTRACURRICULAR,
    targetValue: 2,
  },
]

export function GoalCreationModal({
  isOpen,
  onClose,
  onSuccess,
  fromGapAnalysis,
}: GoalCreationModalProps) {
  const [formData, setFormData] = useState({
    goalType: fromGapAnalysis?.goalType || ('' as GoalType),
    targetValue: fromGapAnalysis?.targetValue || 0,
    currentValue: fromGapAnalysis?.currentValue || 0,
    targetDate: '',
    notes: fromGapAnalysis?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [impactEstimate, setImpactEstimate] = useState(0)

  const utils = trpc.useUtils()
  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success('Goal created successfully!')
      utils.goals.list.invalidate()
      utils.goals.getStats.invalidate()
      handleClose()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create goal')
    },
  })

  // Calculate impact when relevant fields change
  useEffect(() => {
    if (formData.goalType && formData.targetValue > 0) {
      const impact = calculateGoalImpact(
        formData.goalType,
        formData.targetValue,
        formData.currentValue
      )
      setImpactEstimate(Math.round(impact))

      // Set suggested target date if not set
      if (!formData.targetDate && formData.goalType) {
        const suggestedMonths = getSuggestedTimeline(
          formData.goalType,
          formData.targetValue,
          formData.currentValue
        )
        const suggestedDate = addMonths(new Date(), suggestedMonths)
        setFormData((prev) => ({
          ...prev,
          targetDate: format(suggestedDate, 'yyyy-MM-dd'),
        }))
      }
    }
  }, [formData.goalType, formData.targetValue, formData.currentValue])

  const handleClose = () => {
    setFormData({
      goalType: '' as GoalType,
      targetValue: 0,
      currentValue: 0,
      targetDate: '',
      notes: '',
    })
    setErrors({})
    setImpactEstimate(0)
    onClose()
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.goalType) newErrors.goalType = 'Goal type is required'
    if (formData.targetValue <= 0) newErrors.targetValue = 'Target value must be positive'
    if (formData.targetValue <= formData.currentValue) {
      newErrors.targetValue = 'Target must be greater than current value'
    }
    if (!formData.targetDate) newErrors.targetDate = 'Target date is required'
    if (formData.targetDate && new Date(formData.targetDate) <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    createGoal.mutate({
      goalType: formData.goalType,
      targetValue: formData.targetValue,
      currentValue: formData.currentValue,
      targetDate: new Date(formData.targetDate),
      notes: formData.notes || undefined,
    })
  }

  const applyQuickGoal = (quickGoal: typeof QUICK_GOALS[0]) => {
    setFormData((prev) => ({
      ...prev,
      goalType: quickGoal.goalType,
      targetValue: quickGoal.targetValue,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {fromGapAnalysis ? 'Create Goal from Gap Analysis' : 'Create New Goal'}
          </DialogTitle>
          <DialogDescription>
            Set a profile improvement goal and track your progress over time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Goal Templates */}
          {!fromGapAnalysis && (
            <div>
              <Label>Quick Goals</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_GOALS.map((quickGoal) => (
                  <Button
                    key={quickGoal.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickGoal(quickGoal)}
                  >
                    {quickGoal.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Goal Type */}
          <div>
            <Label htmlFor="goalType">Goal Type *</Label>
            <Select
              value={formData.goalType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, goalType: value as GoalType }))
              }
              disabled={!!fromGapAnalysis}
            >
              <SelectTrigger id="goalType">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.goalType && <p className="text-sm text-red-500 mt-1">{errors.goalType}</p>}
          </div>

          {/* Current Value */}
          <div>
            <Label htmlFor="currentValue">
              Current Value ({formData.goalType && getGoalValueUnit(formData.goalType)})
            </Label>
            <Input
              id="currentValue"
              type="number"
              step="any"
              value={formData.currentValue}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>

          {/* Target Value */}
          <div>
            <Label htmlFor="targetValue">
              Target Value ({formData.goalType && getGoalValueUnit(formData.goalType)}) *
            </Label>
            <Input
              id="targetValue"
              type="number"
              step="any"
              value={formData.targetValue || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))
              }
            />
            {errors.targetValue && <p className="text-sm text-red-500 mt-1">{errors.targetValue}</p>}
          </div>

          {/* Target Date */}
          <div>
            <Label htmlFor="targetDate">Target Date *</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetDate: e.target.value }))
              }
            />
            {errors.targetDate && <p className="text-sm text-red-500 mt-1">{errors.targetDate}</p>}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any notes about this goal..."
              rows={3}
            />
          </div>

          {/* Impact Estimate */}
          {impactEstimate > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Estimated Impact</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Completing this goal will increase your profile strength by approximately{' '}
                    <strong>+{impactEstimate} points</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
