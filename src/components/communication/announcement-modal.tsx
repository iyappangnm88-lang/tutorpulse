'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/contexts/toast-context'
import { createAnnouncementAction } from '@/app/(dashboard)/dashboard/communication/actions'
import type { Batch, Student } from '@/types'

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  batches: Batch[]
  students: Student[]
  onSuccess: () => void
}

export function AnnouncementModal({
  isOpen,
  onClose,
  batches,
  students,
  onSuccess,
}: AnnouncementModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'batch' | 'student'>('all')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [errors, setErrors] = useState<{ title?: string; message?: string; target?: string }>({})

  function validate() {
    const errs: typeof errors = {}
    if (!title.trim()) errs.title = 'Title is required.'
    if (!message.trim()) errs.message = 'Message content is required.'
    if (targetType === 'batch' && !selectedBatchId) errs.target = 'Please select a batch.'
    if (targetType === 'student' && !selectedStudentId) errs.target = 'Please select a student.'
    return errs
  }

  async function handlePublish() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const res = await createAnnouncementAction({
        title,
        message,
        target_type: targetType,
        batch_id: targetType === 'batch' ? selectedBatchId : null,
        student_id: targetType === 'student' ? selectedStudentId : null,
      })

      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not create announcement.')
        return
      }

      toast('success', 'Announcement Sent', 'Your notice is now active in the parent portal.')
      setTitle('')
      setMessage('')
      setTargetType('all')
      setSelectedBatchId('')
      setSelectedStudentId('')
      onSuccess()
      onClose()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Announcement"
      description="Publish notices to parent portal for all parents, a batch, or an individual student."
      confirmLabel="Publish Notice"
      onConfirm={handlePublish}
      isLoading={loading}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="ann-title" required>
            Announcement Title
          </Label>
          <Input
            id="ann-title"
            placeholder="e.g. Tomorrow's Class Schedule"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="ann-target" required>
            Target Audience
          </Label>
          <Select
            id="ann-target"
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value as 'all' | 'batch' | 'student')
              setErrors((prev) => ({ ...prev, target: undefined }))
            }}
            disabled={loading}
          >
            <option value="all">All Parents</option>
            <option value="batch">Specific Batch</option>
            <option value="student">Individual Student</option>
          </Select>
        </div>

        {targetType === 'batch' && (
          <div>
            <Label htmlFor="ann-batch" required>
              Select Batch
            </Label>
            <Select
              id="ann-batch"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              error={errors.target}
              disabled={loading}
            >
              <option value="">Choose a batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.subject ? `(${b.subject})` : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        {targetType === 'student' && (
          <div>
            <Label htmlFor="ann-student" required>
              Select Student
            </Label>
            <Select
              id="ann-student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              error={errors.target}
              disabled={loading}
            >
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.class_name ? `(${s.class_name})` : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="ann-message" required>
            Message Content
          </Label>
          <textarea
            id="ann-message"
            rows={4}
            placeholder="Write your announcement here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
        </div>
      </div>
    </Dialog>
  )
}
