'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { extracurricularActivitySchema, calculateVolunteerHours } from '../lib/profile-validation'
import type { ExtracurricularActivity } from '../types'
import { EXTRACURRICULAR_CATEGORIES } from '../types'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================================================
// Component Props
// ============================================================================

interface ExtracurricularFormProps {
  initialActivities?: ExtracurricularActivity[]
  onSave: (activities: ExtracurricularActivity[]) => void | Promise<void>
  isLoading?: boolean
}

// ============================================================================
// Activity Form Schema
// ============================================================================

const activityFormSchema = extracurricularActivitySchema

type ActivityFormData = z.infer<typeof activityFormSchema>

// ============================================================================
// Extracurricular Activities Form Component
// ============================================================================

export function ExtracurricularForm({
  initialActivities = [],
  onSave,
  isLoading = false,
}: ExtracurricularFormProps) {
  const [activities, setActivities] = useState<ExtracurricularActivity[]>(initialActivities)
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: '',
      category: 'Other',
      hoursPerWeek: 0,
      yearsInvolved: 0,
      description: '',
      isLeadership: false,
      leadershipTitle: '',
    },
  })

  const isLeadership = form.watch('isLeadership')

  // Calculate total volunteer hours
  const volunteerHours = calculateVolunteerHours(activities)

  // Handle add new activity
  const handleAdd = () => {
    setIsAdding(true)
    setEditingIndex(null)
    form.reset()
  }

  // Handle edit existing activity
  const handleEdit = (index: number) => {
    const activity = activities[index]
    form.reset(activity)
    setEditingIndex(index)
    setIsAdding(true)
  }

  // Handle delete activity
  const handleDelete = (index: number) => {
    const updatedActivities = activities.filter((_, i) => i !== index)
    setActivities(updatedActivities)
    onSave(updatedActivities)
  }

  // Handle save activity (add or update)
  const handleSaveActivity = (data: ActivityFormData) => {
    let updatedActivities: ExtracurricularActivity[]

    if (editingIndex !== null) {
      // Update existing activity
      updatedActivities = activities.map((activity, i) =>
        i === editingIndex ? data : activity
      )
    } else {
      // Add new activity
      updatedActivities = [...activities, data]
    }

    setActivities(updatedActivities)
    onSave(updatedActivities)
    setIsAdding(false)
    setEditingIndex(null)
    form.reset()
  }

  // Handle cancel
  const handleCancel = () => {
    setIsAdding(false)
    setEditingIndex(null)
    form.reset()
  }

  return (
    <div className="space-y-6">
      {/* Volunteer Hours Summary */}
      {volunteerHours > 0 && (
        <div className="rounded-md bg-primary/10 p-4">
          <h4 className="text-sm font-semibold text-primary">
            Total Volunteer Hours
          </h4>
          <p className="text-2xl font-bold text-primary">
            {volunteerHours.toLocaleString()} hours
          </p>
          <p className="text-sm text-muted-foreground">
            Estimated from Community Service activities
          </p>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Extracurricular Activities</Label>
          {!isAdding && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isLoading}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
            >
              + Add Activity
            </button>
          )}
        </div>

        {/* Existing Activities */}
        {activities.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activities added yet. Click "Add Activity" to get started.
          </p>
        )}

        {activities.map((activity, index) => (
          <div
            key={index}
            className="rounded-md border border-border p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{activity.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {activity.category} • {activity.hoursPerWeek} hrs/week • {activity.yearsInvolved} years
                </p>
                {activity.isLeadership && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mt-1">
                    Leadership: {activity.leadershipTitle}
                  </span>
                )}
                {activity.description && (
                  <p className="text-sm mt-2">{activity.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  type="button"
                  onClick={() => handleEdit(index)}
                  disabled={isLoading}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  disabled={isLoading}
                  className="text-sm text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="rounded-md border border-border p-4 space-y-4">
          <h4 className="font-semibold">
            {editingIndex !== null ? 'Edit Activity' : 'Add New Activity'}
          </h4>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveActivity)} className="space-y-4">
              {/* Activity Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Debate Team, Varsity Soccer" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXTRACURRICULAR_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hours Per Week */}
              <FormField
                control={form.control}
                name="hoursPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Per Week *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        max={40}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Years Involved */}
              <FormField
                control={form.control}
                name="yearsInvolved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years Involved *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        max={6}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        value={field.value || ''}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Brief description of your involvement..."
                        maxLength={200}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0} / 200 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Leadership Checkbox */}
              <FormField
                control={form.control}
                name="isLeadership"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is a leadership role</FormLabel>
                      <FormDescription>
                        Check if you held a leadership position in this activity
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Leadership Title */}
              {isLeadership && (
                <FormField
                  control={form.control}
                  name="leadershipTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leadership Title *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="e.g., President, Captain, Team Lead" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  {editingIndex !== null ? 'Update Activity' : 'Save Activity'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 border border-border rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Help Text */}
      {!isAdding && (
        <p className="text-sm text-muted-foreground">
          Examples: Debate Team, Varsity Soccer, National Honor Society, Habitat for Humanity volunteer
        </p>
      )}
    </div>
  )
}
