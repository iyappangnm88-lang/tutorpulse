'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { useToast } from '@/contexts/toast-context'
import { createHomeworkAction, updateHomeworkAction } from '@/app/(dashboard)/dashboard/homework/actions'
import type { HomeworkWithDetails, Batch } from '@/types'

interface HomeworkFormProps {
  batches: Batch[]
  initialData?: HomeworkWithDetails
  initialBatchId?: string
  mode: 'create' | 'edit'
}

export function HomeworkForm({
  batches,
  initialData,
  initialBatchId,
  mode,
}: HomeworkFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    batch_id: initialData?.batch_id || initialBatchId || (batches[0]?.id ?? ''),
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions || '',
    assigned_date: initialData?.assigned_date || todayStr,
    due_date: initialData?.due_date || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.batch_id) {
      errs.batch_id = 'Please select a batch.'
    }
    if (!formData.title.trim()) {
      errs.title = 'Homework title is required.'
    }
    if (!formData.assigned_date) {
      errs.assigned_date = 'Assigned date is required.'
    }
    if (formData.due_date && formData.due_date < formData.assigned_date) {
      errs.due_date = 'Due date cannot be earlier than assigned date.'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      if (mode === 'create') {
        const res = await createHomeworkAction({
          batch_id: formData.batch_id,
          title: formData.title,
          description: formData.description || null,
          instructions: formData.instructions || null,
          assigned_date: formData.assigned_date,
          due_date: formData.due_date || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create homework.')
          return
        }

        toast('success', 'Homework Assigned', `"${formData.title}" assigned to students.`)
        router.push(`/dashboard/homework/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateHomeworkAction(initialData.id, {
          batch_id: formData.batch_id,
          title: formData.title,
          description: formData.description || null,
          instructions: formData.instructions || null,
          assigned_date: formData.assigned_date,
          due_date: formData.due_date || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update homework.')
          return
        }

        toast('success', 'Homework Updated', 'Changes saved successfully.')
        router.push(`/dashboard/homework/${initialData.id}`)
        router.refresh()
      }
    } catch {
      toast('error', 'Unexpected Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Assignment Details</h2>
          <p className="text-sm text-gray-500">Specify batch, assignment task, and completion timeline.</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="batch_id" required>
              Assign to Batch
            </Label>
            <Select
              id="batch_id"
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              error={errors.batch_id}
              disabled={loading || mode === 'edit'}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.class_name ? `(${b.class_name})` : ''} {b.subject ? `• ${b.subject}` : ''}
                </option>
              ))}
            </Select>
            {mode === 'edit' && (
              <p className="text-xs text-gray-400 mt-1">Batch assignment cannot be changed after creation.</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="title" required>
              Homework Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Trigonometry Exercise 4.2 (Q1 to Q10)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="assigned_date" required>
              Assigned Date
            </Label>
            <Input
              id="assigned_date"
              type="date"
              value={formData.assigned_date}
              onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              error={errors.assigned_date}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="due_date">
              Due Date (Optional)
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              error={errors.due_date}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Short Summary</Label>
            <Input
              id="description"
              placeholder="e.g. Covers Heights and Distances formula applications"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="instructions">Detailed Instructions / Textbook References</Label>
            <Textarea
              id="instructions"
              placeholder="e.g. Complete problems in class notebook. Draw figures for Q4, Q7, and Q9. Bring notebook next Monday for correction."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              disabled={loading}
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Assign Homework' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
