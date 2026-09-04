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
import { createTestAction, updateTestAction } from '@/app/(dashboard)/dashboard/tests/actions'
import type { TestWithDetails, Batch } from '@/types'

interface TestFormProps {
  batches: Batch[]
  initialData?: TestWithDetails
  initialBatchId?: string
  mode: 'create' | 'edit'
}

export function TestForm({
  batches,
  initialData,
  initialBatchId,
  mode,
}: TestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    batch_id: initialData?.batch_id || initialBatchId || (batches[0]?.id ?? ''),
    title: initialData?.title || '',
    description: initialData?.description || '',
    test_date: initialData?.test_date || todayStr,
    max_marks: initialData?.max_marks ? String(initialData.max_marks) : '100',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.batch_id) {
      errs.batch_id = 'Please select a batch.'
    }
    if (!formData.title.trim()) {
      errs.title = 'Test title is required.'
    }
    if (!formData.test_date) {
      errs.test_date = 'Test date is required.'
    }
    const maxVal = parseFloat(formData.max_marks)
    if (isNaN(maxVal) || maxVal <= 0) {
      errs.max_marks = 'Maximum marks must be greater than 0.'
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

    const parsedMaxMarks = parseFloat(formData.max_marks)

    try {
      if (mode === 'create') {
        const res = await createTestAction({
          batch_id: formData.batch_id,
          title: formData.title,
          description: formData.description || null,
          test_date: formData.test_date,
          max_marks: parsedMaxMarks,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create test.')
          return
        }

        toast('success', 'Test Created', `"${formData.title}" scheduled successfully.`)
        router.push(`/dashboard/tests/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateTestAction(initialData.id, {
          batch_id: formData.batch_id,
          title: formData.title,
          description: formData.description || null,
          test_date: formData.test_date,
          max_marks: parsedMaxMarks,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update test.')
          return
        }

        toast('success', 'Test Updated', 'Changes saved successfully.')
        router.push(`/dashboard/tests/${initialData.id}`)
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
          <h2 className="text-base font-semibold text-gray-900">Test Information</h2>
          <p className="text-sm text-gray-500">Configure test details, schedule, and scoring scale.</p>
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
              Test Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Mathematics Mid-Term Exam"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="test_date" required>
              Test Date
            </Label>
            <Input
              id="test_date"
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              error={errors.test_date}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="max_marks" required>
              Maximum Marks
            </Label>
            <Input
              id="max_marks"
              type="number"
              step="any"
              min="1"
              placeholder="100"
              value={formData.max_marks}
              onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
              error={errors.max_marks}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Syllabus / Topics Covered</Label>
            <Textarea
              id="description"
              placeholder="e.g. Chapters 1 to 4: Real Numbers, Polynomials, Linear Equations, Quadratic Equations."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          {mode === 'create' ? 'Create Test' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
