'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { workExperienceSchema } from '../lib/profile-validation'
import type { WorkExperience } from '../types'
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

// Component similar to ExtracurricularForm but for work experience
interface WorkExperienceFormProps {
  initialWork?: WorkExperience[]
  onSave: (work: WorkExperience[]) => void | Promise<void>
  isLoading?: boolean
}

type WorkFormData = z.infer<typeof workExperienceSchema>

export function WorkExperienceForm({
  initialWork = [],
  onSave,
  isLoading = false,
}: WorkExperienceFormProps) {
  const [workList, setWorkList] = useState<WorkExperience[]>(initialWork)
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentlyEmployed, setCurrentlyEmployed] = useState(false)

  const form = useForm<WorkFormData>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      jobTitle: '',
      employer: '',
      startDate: '',
      endDate: '',
      hoursPerWeek: 0,
      description: '',
    },
  })

  const handleAdd = () => {
    setIsAdding(true)
    setEditingIndex(null)
    setCurrentlyEmployed(false)
    form.reset()
  }

  const handleEdit = (index: number) => {
    const job = workList[index]
    if (job) {
      form.reset(job)
      setEditingIndex(index)
      setCurrentlyEmployed(!job.endDate)
      setIsAdding(true)
    }
  }

  const handleDelete = (index: number) => {
    const updated = workList.filter((_, i) => i !== index)
    setWorkList(updated)
    onSave(updated)
  }

  const handleSave = (data: WorkFormData) => {
    // If currently employed, set endDate to undefined
    const jobData = currentlyEmployed ? { ...data, endDate: undefined } : data

    let updated: WorkExperience[]
    if (editingIndex !== null) {
      updated = workList.map((job, i) => (i === editingIndex ? jobData : job))
    } else {
      updated = [...workList, jobData]
    }

    setWorkList(updated)
    onSave(updated)
    setIsAdding(false)
    setEditingIndex(null)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Work Experience</Label>
        {!isAdding && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isLoading}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
          >
            + Add Job
          </button>
        )}
      </div>

      {workList.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No work experience added yet.
        </p>
      )}

      {workList.map((job, index) => (
        <div key={index} className="rounded-md border border-border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">{job.jobTitle}</h4>
              <p className="text-sm text-muted-foreground">{job.employer}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(job.startDate).toLocaleDateString()} -{' '}
                {job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Present'}
                {' '} • {job.hoursPerWeek} hrs/week
              </p>
              {job.description && <p className="text-sm mt-2">{job.description}</p>}
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

      {isAdding && (
        <div className="rounded-md border border-border p-4">
          <h4 className="font-semibold mb-4">
            {editingIndex !== null ? 'Edit Job' : 'Add Work Experience'}
          </h4>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Sales Associate, Intern" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Company or organization name" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!currentlyEmployed && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="date" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={currentlyEmployed}
                  onCheckedChange={(checked) => {
                    setCurrentlyEmployed(checked as boolean)
                    if (checked) {
                      form.setValue('endDate', undefined)
                    }
                  }}
                  disabled={isLoading}
                />
                <Label className="text-sm font-normal">Currently employed</Label>
              </div>

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
                        max={80}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Key responsibilities..."
                        maxLength={300}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0} / 300 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  {editingIndex !== null ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
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

      {!isAdding && (
        <p className="text-sm text-muted-foreground">
          Include part-time jobs, internships, and paid work experience
        </p>
      )}
    </div>
  )
}
