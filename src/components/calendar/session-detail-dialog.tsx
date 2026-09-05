'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle,
  Play,
  RotateCcw,
  XCircle,
  CalendarDays,
  FileText,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { SessionStatusBadge } from './session-status-badge'
import { RescheduleDialog } from './reschedule-dialog'
import {
  updateSessionStatusAction,
  updateSessionDetailsAction,
} from '@/app/(dashboard)/dashboard/calendar/actions'
import { formatTimeRange, formatDuration, CLASS_MODE_METADATA } from '@/lib/scheduling'
import type { ClassSessionWithBatch, ClassSessionStatus } from '@/types'

interface SessionDetailDialogProps {
  session: ClassSessionWithBatch | null
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function SessionDetailDialog({
  session,
  isOpen,
  onClose,
  onRefresh,
}: SessionDetailDialogProps) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      setNotes(session.notes || '')
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [session, isOpen])

  if (!session) return null

  const modeMeta = CLASS_MODE_METADATA[session.class_mode || 'offline']
  const durationText = formatDuration(session.start_time, session.end_time)
  const timeRangeText = formatTimeRange(session.start_time, session.end_time)

  const handleStatusChange = async (newStatus: ClassSessionStatus) => {
    setActionLoading(newStatus)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const res = await updateSessionStatusAction(session.id, newStatus)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update session status.')
        return
      }
      setSuccessMessage(`Session marked as ${newStatus.replace('_', ' ')}!`)
      onRefresh()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const res = await updateSessionDetailsAction(session.id, {
        notes: notes.trim() || null,
      })
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to save notes.')
        return
      }
      setSuccessMessage('Notes saved successfully!')
      onRefresh()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={session.batch.name}
        description={session.batch.subject ? `${session.batch.subject} • Session Details` : 'Session Details'}
      >
        <div className="space-y-4 pt-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Details Card */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <SessionStatusBadge status={session.status} />
              <div className="flex items-center gap-1.5">
                <Badge variant={modeMeta.badgeVariant}>{modeMeta.label}</Badge>
                {session.is_overridden && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Overridden
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="font-medium">{session.session_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>
                  {timeRangeText} {durationText && <span className="text-gray-400">({durationText})</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>{session.student_count ?? 0} Students Enrolled</span>
              </div>
              {session.location && (
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="truncate" title={session.location}>
                    {session.location}
                  </span>
                </div>
              )}
            </div>

            {session.meeting_link && (
              <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-indigo-600" />
                  Online Class Link:
                </span>
                <a
                  href={session.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Join Meeting <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Session Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="session-notes" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                <span>Session Notes / Agenda</span>
              </label>
              {notes !== (session.notes || '') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveNotes}
                  loading={isSavingNotes}
                  className="h-7 text-xs px-2.5"
                >
                  Save Notes
                </Button>
              )}
            </div>
            <Textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda, topics covered, or reminders for this session..."
              rows={3}
              className="text-xs"
            />
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                onClick={onClose}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Attendance
              </Link>
              <Link
                href={`/dashboard/batches/${session.batch_id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Batch Details
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {session.status === 'scheduled' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRescheduleOpen(true)}
                    className="h-8 text-xs"
                  >
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('cancelled')}
                    loading={actionLoading === 'cancelled'}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStatusChange('in_progress')}
                    loading={actionLoading === 'in_progress'}
                    className="h-8 text-xs"
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Start Class
                  </Button>
                </>
              )}

              {session.status === 'in_progress' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('cancelled')}
                    loading={actionLoading === 'cancelled'}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Cancel Class
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStatusChange('completed')}
                    loading={actionLoading === 'completed'}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Mark Completed
                  </Button>
                </>
              )}

              {session.status === 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('scheduled')}
                  loading={actionLoading === 'scheduled'}
                  className="h-8 text-xs text-gray-600"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reopen
                </Button>
              )}

              {session.status === 'cancelled' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('scheduled')}
                  loading={actionLoading === 'scheduled'}
                  className="h-8 text-xs text-indigo-600"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restore Class
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      <RescheduleDialog
        session={session}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onSuccess={() => {
          onRefresh()
          onClose()
        }}
      />
    </>
  )
}
