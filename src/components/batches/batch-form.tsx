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
import { createBatchAction, updateBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import type { Batch, BatchStatus } from '@/types'

interface BatchFormProps {
  initialData?: Batch
  mode: 'create' | 'edit'
}

export function BatchForm({ initialData, mode }: BatchFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    class_name: initialData?.class_name || '',
    schedule: initialData?.schedule || '',
    description: initialData?.description || '',
    status: (initialData?.status || 'active') as BatchStatus,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) {
      errs.name = 'Batch name is required.'
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
        const res = await createBatchAction({
          name: formData.name,
          subject: formData.subject || null,
          class_name: formData.class_name || null,
          schedule: formData.schedule || null,
          description: formData.description || null,
          status: formData.status,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create batch')
          return
        }

        toast('success', 'Batch Created', `${formData.name} is ready for student enrollment.`)
        router.push(`/dashboard/batches/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateBatchAction(initialData.id, {
          name: formData.name,
          subject: formData.subject || null,
          class_name: formData.class_name || null,
          schedule: formData.schedule || null,
          description: formData.description || null,
          status: formData.status,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update batch')
          return
        }

        toast('success', 'Batch Updated', `${formData.name} details have been saved.`)
        router.push(`/dashboard/batches/${initialData.id}`)
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
          <h2 className="text-base font-semibold text-gray-900">Batch Information</h2>
          <p className="text-sm text-gray-500">Name, subject, grade level, and routine schedule.</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name" required>
              Batch Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Class 10 Board Prep - Batch A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g. Mathematics, Science, English"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="class_name">Grade / Standard</Label>
            <Input
              id="class_name"
              placeholder="e.g. Class 10, Grade 9, XII PCM"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="schedule">Schedule / Timings</Label>
            <Input
              id="schedule"
              placeholder="e.g. Mon, Wed, Fri • 5:00 PM - 6:30 PM"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="status">Batch Status</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as BatchStatus })}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Description / Syllabus Goal</h2>
          <p className="text-sm text-gray-500">Optional notes regarding batch syllabus or milestones.</p>
        </CardHeader>
        <CardBody>
          <Textarea
            id="description"
            placeholder="e.g. Focus on NCERT syllabus + Exemplar problems. Target completion by November."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
          />
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
          {mode === 'create' ? 'Create Batch' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
