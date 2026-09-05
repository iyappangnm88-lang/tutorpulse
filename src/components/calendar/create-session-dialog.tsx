'use client'

import React, { useState } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createAdhocSessionAction } from '@/app/(dashboard)/dashboard/calendar/actions'
import type { Batch, ClassMode } from '@/types'

interface CreateSessionDialogProps {
  batches: Batch[]
  defaultDate?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSessionDialog({
  batches,
  defaultDate,
  isOpen,
  onClose,
  onSuccess,
}: CreateSessionDialogProps) {
  const [batchId, setBatchId] = useState<string>(batches[0]?.id || '')
  const [sessionDate, setSessionDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState<string>('17:00')
  const [endTime, setEndTime] = useState<string>('18:00')
  const [classMode, setClassMode] = useState<ClassMode>('offline')
  const [location, setLocation] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleBatchChange = (id: string) => {
    setBatchId(id)
    const selected = batches.find((b) => b.id === id)
    if (selected) {
      if (selected.start_time) setStartTime(selected.start_time.slice(0, 5))
      if (selected.end_time) setEndTime(selected.end_time.slice(0, 5))
      if (selected.class_mode) setClassMode(selected.class_mode)
      if (selected.location) setLocation(selected.location)
    }
  }

  const handleCreate = async () => {
    setErrorMessage(null)

    if (!batchId) {
      setErrorMessage('Please select a batch.')
      return
    }
    if (!sessionDate) {
      setErrorMessage('Please choose a date.')
      return
    }
    if (!startTime || !endTime) {
      setErrorMessage('Please provide start and end times.')
      return
    }
    if (endTime <= startTime) {
      setErrorMessage('End time must be after start time.')
      return
    }

    setIsLoading(true)
    try {
      const res = await createAdhocSessionAction({
        batch_id: batchId,
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        class_mode: classMode,
        location: location.trim() || null,
        notes: notes.trim() || null,
      })

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create class session.')
        return
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Class Session"
      description="Schedule an extra session or ad-hoc class for a batch."
    >
      <div className="space-y-3.5 pt-1 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <Label htmlFor="session-batch" className="text-xs font-semibold text-gray-700">
            Select Batch
          </Label>
          <Select
            id="session-batch"
            value={batchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="mt-1"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.subject ? `(${b.subject})` : ''}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="session-date-input" className="text-xs font-semibold text-gray-700">
            Date
          </Label>
          <Input
            id="session-date-input"
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-session-start" className="text-xs font-semibold text-gray-700">
              Start Time
            </Label>
            <Input
              id="new-session-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-session-end" className="text-xs font-semibold text-gray-700">
              End Time
            </Label>
            <Input
              id="new-session-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-session-mode" className="text-xs font-semibold text-gray-700">
              Class Mode
            </Label>
            <Select
              id="new-session-mode"
              value={classMode}
              onChange={(e) => setClassMode(e.target.value as ClassMode)}
              className="mt-1"
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="new-session-location" className="text-xs font-semibold text-gray-700">
              Location / Room
            </Label>
            <Input
              id="new-session-location"
              type="text"
              placeholder="Room 101, Main Center"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="new-session-notes" className="text-xs font-semibold text-gray-700">
            Session Agenda / Topic (Optional)
          </Label>
          <Input
            id="new-session-notes"
            type="text"
            placeholder="e.g. Revision for upcoming exam"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate} loading={isLoading}>
            <Plus className="h-4 w-4 mr-1" />
            Schedule Class
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
