'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { awardHonorSchema } from '../lib/profile-validation'
import type { AwardHonor } from '../types'
import { AWARD_LEVELS } from '../types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AwardsHonorsFormProps {
  initialAwards?: AwardHonor[]
  onSave: (awards: AwardHonor[]) => void | Promise<void>
  isLoading?: boolean
}

type AwardFormData = z.infer<typeof awardHonorSchema>

const levelColors = {
  School: 'bg-gray-100 text-gray-800',
  Local: 'bg-blue-100 text-blue-800',
  State: 'bg-green-100 text-green-800',
  National: 'bg-orange-100 text-orange-800',
  International: 'bg-yellow-100 text-yellow-800',
}

export function AwardsHonorsForm({
  initialAwards = [],
  onSave,
  isLoading = false,
}: AwardsHonorsFormProps) {
  const [awards, setAwards] = useState<AwardHonor[]>(initialAwards)
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const form = useForm<AwardFormData>({
    resolver: zodResolver(awardHonorSchema),
    defaultValues: {
      name: '',
      issuer: '',
      date: '',
      level: 'School',
      description: '',
    },
  })

  const handleSave = (data: AwardFormData) => {
    let updated: AwardHonor[]
    if (editingIndex !== null) {
      updated = awards.map((award, i) => (i === editingIndex ? data : award))
    } else {
      updated = [...awards, data]
    }
    setAwards(updated)
    onSave(updated)
    setIsAdding(false)
    setEditingIndex(null)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Awards & Honors</Label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true)
              setEditingIndex(null)
              form.reset()
            }}
            disabled={isLoading}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
          >
            + Add Award
          </button>
        )}
      </div>

      {awards.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No awards added yet.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {awards.map((award, index) => (
          <div key={index} className="rounded-md border border-border p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">{award.name}</h4>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[award.level]}`}>
                {award.level}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{award.issuer}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(award.date).toLocaleDateString()}
            </p>
            {award.description && <p className="text-sm mt-2">{award.description}</p>}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  form.reset(award)
                  setEditingIndex(index)
                  setIsAdding(true)
                }}
                disabled={isLoading}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = awards.filter((_, i) => i !== index)
                  setAwards(updated)
                  onSave(updated)
                }}
                disabled={isLoading}
                className="text-sm text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="rounded-md border border-border p-4">
          <h4 className="font-semibold mb-4">
            {editingIndex !== null ? 'Edit Award' : 'Add Award or Honor'}
          </h4>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Award Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Honor Roll, National Merit Finalist" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Who gave this award?" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Received *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AWARD_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Brief description..."
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
          Examples: Honor Roll, AP Scholar, Eagle Scout, National Merit Finalist
        </p>
      )}
    </div>
  )
}
