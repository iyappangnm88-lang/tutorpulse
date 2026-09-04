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
import { createFeeAction, updateFeeAction } from '@/app/(dashboard)/dashboard/fees/actions'
import type { FeeWithDetails, Student } from '@/types'

interface FeeFormProps {
  students: Student[]
  initialData?: FeeWithDetails
  mode: 'create' | 'edit'
}

export function FeeForm({ students, initialData, mode }: FeeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    student_id: initialData?.student_id || (students[0]?.id ?? ''),
    title: initialData?.title || '',
    description: initialData?.description || '',
    amount: initialData ? String(initialData.amount) : '',
    due_date: initialData?.due_date || todayStr,
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.student_id) {
      errs.student_id = 'Please select a student.'
    }
    if (!formData.title.trim()) {
      errs.title = 'Fee title is required.'
    }
    const valAmount = parseFloat(formData.amount)
    if (isNaN(valAmount) || valAmount <= 0) {
      errs.amount = 'Amount must be greater than ₹0.'
    }
    if (!formData.due_date) {
      errs.due_date = 'Please select a valid due date.'
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
        const res = await createFeeAction({
          student_id: formData.student_id,
          title: formData.title,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          notes: formData.notes || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create fee.')
          return
        }

        toast('success', 'Fee Created', `"${formData.title}" was successfully recorded.`)
        router.push(`/dashboard/fees/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateFeeAction(initialData.id, {
          student_id: formData.student_id,
          title: formData.title,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          notes: formData.notes || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update fee.')
          return
        }

        toast('success', 'Fee Updated', 'Fee details have been saved.')
        router.push(`/dashboard/fees/${initialData.id}`)
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
          <h2 className="text-base font-semibold text-gray-900">Fee Details</h2>
          <p className="text-sm text-gray-500">Specify student, charge amount, and due date.</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="student_id" required>
              Student
            </Label>
            <Select
              id="student_id"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              error={errors.student_id}
              disabled={loading || mode === 'edit'}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.class_name ? `(${s.class_name})` : ''}
                </option>
              ))}
            </Select>
            {mode === 'edit' && (
              <p className="text-xs text-gray-400 mt-1">Student assignment cannot be changed after creation.</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="title" required>
              Fee Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Monthly Tuition Fee - October"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="amount" required>
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="e.g. 2500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              error={errors.amount}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="due_date" required>
              Due Date
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
            <Label htmlFor="description">Description / Purpose</Label>
            <Textarea
              id="description"
              placeholder="e.g. Covers 12 classes of Mathematics and Physics."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Private Remarks</h2>
          <p className="text-sm text-gray-500">Internal notes visible only to you.</p>
        </CardHeader>
        <CardBody>
          <Textarea
            id="notes"
            placeholder="e.g. Parent requested 2 installments."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          {mode === 'create' ? 'Create Fee' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
