'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rescheduleSessionAction } from '@/app/(dashboard)/dashboard/calendar/actions'
import { formatTime12Hour, formatTimeRange } from '@/lib/scheduling'
import type { ClassSessionWithBatch } from '@/types'

interface RescheduleDialogProps {
  session: ClassSessionWithBatch | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RescheduleDialog({
  session,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      setNewDate(session.session_date)
      setNewStartTime(session.start_time?.slice(0, 5) || '')
      setNewEndTime(session.end_time?.slice(0, 5) || '')
      setErrorMessage(null)
    }
  }, [session, isOpen])

  if (!session) return null

  const handleReschedule = async () => {
    setErrorMessage(null)

    if (!newDate) {
      setErrorMessage('Please choose a date.')
      return
    }
    if (!newStartTime || !newEndTime) {
      setErrorMessage('Please select start and end times.')
      return
    }
    if (newEndTime <= newStartTime) {
      setErrorMessage('End time must be later than start time.')
      return
    }

    setIsLoading(true)
    try {
      const res = await rescheduleSessionAction(
        session.id,
        newDate,
        newStartTime,
        newEndTime
      )

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to reschedule session.')
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
      title="Reschedule Class Session"
      description={`Rescheduling applies only to this single class occurrence (${session.batch.name}). Recurring batch schedule remains unchanged.`}
    >
      <div className="space-y-4 pt-1">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
          <div className="font-semibold text-gray-800">{session.batch.name}</div>
          <div className="text-gray-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>Current Date: {session.session_date}</span>
          </div>
          <div className="text-gray-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>Current Time: {formatTimeRange(session.start_time, session.end_time)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="reschedule-date" className="text-xs font-semibold text-gray-700">
              New Date
            </Label>
            <Input
              id="reschedule-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="reschedule-start" className="text-xs font-semibold text-gray-700">
                Start Time
              </Label>
              <Input
                id="reschedule-start"
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reschedule-end" className="text-xs font-semibold text-gray-700">
                End Time
              </Label>
              <Input
                id="reschedule-end"
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleReschedule} loading={isLoading}>
            Confirm Reschedule
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
