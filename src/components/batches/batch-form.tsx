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
import { WorkingDaysSelector } from './working-days-selector'
import { TimeRangePicker } from './time-range-picker'
import { ClassModeSelector } from './class-mode-selector'
import { validateBatchSchedule, type WorkingDay, type ClassMode } from '@/lib/scheduling'
import type { Batch, BatchStatus } from '@/types'

interface BatchFormProps {
  initialData?: Batch
  mode: 'create' | 'edit'
}

export function BatchForm({ initialData, mode }: BatchFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Safe time formatting for HTML type="time" input (HH:mm)
  const safeStartTime = initialData?.start_time ? initialData.start_time.slice(0, 5) : ''
  const safeEndTime = initialData?.end_time ? initialData.end_time.slice(0, 5) : ''

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    class_name: initialData?.class_name || '',
    working_days: (initialData?.working_days || []) as WorkingDay[],
    start_time: safeStartTime,
    end_time: safeEndTime,
    class_mode: (initialData?.class_mode || 'offline') as ClassMode,
    location: initialData?.location || '',
    description: initialData?.description || '',
    status: (initialData?.status || 'active') as BatchStatus,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) {
      errs.name = 'Batch name is required.'
    }

    const scheduleValidation = validateBatchSchedule({
      working_days: formData.working_days,
      start_time: formData.start_time,
      end_time: formData.end_time,
      class_mode: formData.class_mode,
      location: formData.location,
    })

    if (!scheduleValidation.isValid) {
      Object.assign(errs, scheduleValidation.errors)
    }

    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstError = Object.values(validationErrors)[0]
      toast('error', 'Validation Notice', firstError)
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
          working_days: formData.working_days,
          start_time: formData.start_time,
          end_time: formData.end_time,
          class_mode: formData.class_mode,
          location: formData.class_mode === 'online' ? null : (formData.location || null),
          description: formData.description || null,
          status: formData.status,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create batch')
          return
        }

        toast('success', 'Batch Created', `${formData.name} is ready with its recurring schedule.`)
        router.push(`/dashboard/batches/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateBatchAction(initialData.id, {
          name: formData.name,
          subject: formData.subject || null,
          class_name: formData.class_name || null,
          working_days: formData.working_days,
          start_time: formData.start_time,
          end_time: formData.end_time,
          class_mode: formData.class_mode,
          location: formData.class_mode === 'online' ? null : (formData.location || null),
          description: formData.description || null,
          status: formData.status,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update batch')
          return
        }

        toast('success', 'Batch Updated', `${formData.name} schedule and details have been saved.`)
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
      {/* STEP 1: General Batch Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">1. Batch Information</h2>
              <p className="text-xs text-gray-500 mt-0.5">Name, subject, and grade level for this cohort.</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              Step 1 of 3
            </span>
          </div>
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
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
              }}
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
        </CardBody>
      </Card>

      {/* STEP 2: Intelligent Batch Scheduling Engine */}
      <Card className="border-indigo-100 shadow-xs">
        <CardHeader className="bg-indigo-50/40 border-b border-indigo-100/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">2. Routine Schedule & Mode</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Every batch has its own recurring weekly schedule, timing, and class mode.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
              Step 2 of 3
            </span>
          </div>
        </CardHeader>
        <CardBody className="space-y-6 pt-5">
          {/* Working Days Selector */}
          <WorkingDaysSelector
            value={formData.working_days}
            onChange={(days) => {
              setFormData({ ...formData, working_days: days })
              if (errors.working_days) setErrors((prev) => ({ ...prev, working_days: '' }))
            }}
            error={errors.working_days}
            disabled={loading}
          />

          <div className="border-t border-gray-100 pt-5">
            {/* Time Range Picker */}
            <TimeRangePicker
              startTime={formData.start_time}
              endTime={formData.end_time}
              onStartTimeChange={(time) => {
                setFormData({ ...formData, start_time: time })
                if (errors.start_time || errors.end_time) {
                  setErrors((prev) => ({ ...prev, start_time: '', end_time: '' }))
                }
              }}
              onEndTimeChange={(time) => {
                setFormData({ ...formData, end_time: time })
                if (errors.end_time) setErrors((prev) => ({ ...prev, end_time: '' }))
              }}
              startError={errors.start_time}
              endError={errors.end_time}
              disabled={loading}
            />
          </div>

          <div className="border-t border-gray-100 pt-5">
            {/* Class Mode & Location */}
            <ClassModeSelector
              mode={formData.class_mode}
              location={formData.location}
              onModeChange={(m) => {
                setFormData({ ...formData, class_mode: m })
                if (errors.class_mode) setErrors((prev) => ({ ...prev, class_mode: '' }))
              }}
              onLocationChange={(loc) => {
                setFormData({ ...formData, location: loc })
                if (errors.location) setErrors((prev) => ({ ...prev, location: '' }))
              }}
              locationError={errors.location}
              disabled={loading}
            />
          </div>
        </CardBody>
      </Card>

      {/* STEP 3: Details & Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">3. Notes & Status</h2>
              <p className="text-xs text-gray-500 mt-0.5">Syllabus goals and cohort visibility.</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              Step 3 of 3
            </span>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="description">Description / Syllabus Goal (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g. Complete NCERT textbook syllabus by October. Weekly tests every Saturday."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="sm:max-w-xs">
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

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="min-w-[140px]">
          {mode === 'create' ? 'Create Batch' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
