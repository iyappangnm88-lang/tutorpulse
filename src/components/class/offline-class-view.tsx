'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Play,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileText,
  Save,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/contexts/toast-context'
import { formatTime12Hour } from '@/lib/scheduling'
import {
  updateOfflineClassStatusAction,
  saveOfflineSessionNotesAction,
  saveOfflineAttendanceAction,
} from '@/app/(dashboard)/dashboard/class/actions'
import type { ClassSessionWithBatch, EnrolledStudent, Attendance, AttendanceStatus, ClassSessionStatus } from '@/types'

interface OfflineClassViewProps {
  session: ClassSessionWithBatch
  enrolledStudents: EnrolledStudent[]
  existingAttendance: Attendance[]
}

interface StudentAttendanceRecord {
  status: AttendanceStatus
  note: string
}

function buildInitialRecords(
  students: EnrolledStudent[],
  attendance: Attendance[]
): Record<string, StudentAttendanceRecord> {
  const map: Record<string, StudentAttendanceRecord> = {}
  const attMap = new Map(attendance.map((a) => [a.student_id, a]))

  for (const { student } of students) {
    const existing = attMap.get(student.id)
    if (existing) {
      map[student.id] = {
        status: existing.status,
        note: existing.note || '',
      }
    } else {
      map[student.id] = {
        status: 'present',
        note: '',
      }
    }
  }
  return map
}

export function OfflineClassView({
  session,
  enrolledStudents,
  existingAttendance,
}: OfflineClassViewProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Class lifecycle status state
  const [currentStatus, setCurrentStatus] = useState<ClassSessionStatus>(session.status)

  // Attendance state
  const [records, setRecords] = useState<Record<string, StudentAttendanceRecord>>(() =>
    buildInitialRecords(enrolledStudents, existingAttendance)
  )
  const [attendanceSaved, setAttendanceSaved] = useState(existingAttendance.length > 0)
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)

  // Chalkboard notes state
  const [notes, setNotes] = useState(session.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // Attendance summary counts
  const attendanceCounts = React.useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    for (const rec of Object.values(records)) {
      if (rec.status === 'present') present++
      else if (rec.status === 'absent') absent++
      else if (rec.status === 'late') late++
    }
    return { present, absent, late, total: enrolledStudents.length }
  }, [records, enrolledStudents])

  // Handle Class status updates (Start Class / End Class)
  const handleStatusChange = (newStatus: ClassSessionStatus) => {
    startTransition(async () => {
      const res = await updateOfflineClassStatusAction(session.id, newStatus)
      if (res.success) {
        setCurrentStatus(newStatus)
        toast(
          'success',
          newStatus === 'in_progress'
            ? 'Class Started!'
            : newStatus === 'completed'
            ? 'Class Completed!'
            : 'Class Status Updated',
          newStatus === 'in_progress'
            ? 'Physical class is now active. You can record attendance and notes.'
            : 'Session marked as completed successfully.'
        )
      } else {
        toast('error', 'Update Failed', res.error || 'Failed to update class status.')
      }
    })
  }

  // Update single student attendance status
  const handleStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }))
    setAttendanceSaved(false)
  }

  // Mark all students present
  const handleMarkAllPresent = () => {
    setRecords((prev) => {
      const updated = { ...prev }
      for (const studentId of Object.keys(updated)) {
        updated[studentId] = {
          ...updated[studentId],
          status: 'present',
        }
      }
      return updated
    })
    setAttendanceSaved(false)
  }

  // Save Attendance to DB
  const handleSaveAttendance = async () => {
    if (enrolledStudents.length === 0) return
    setIsSavingAttendance(true)
    try {
      const entries = enrolledStudents.map(({ student }) => ({
        student_id: student.id,
        status: records[student.id]?.status || 'present',
        note: records[student.id]?.note || null,
      }))

      const res = await saveOfflineAttendanceAction(
        session.batch_id,
        session.id,
        session.session_date,
        entries
      )

      if (res.success) {
        setAttendanceSaved(true)
        toast('success', 'Attendance Saved', `Recorded attendance for ${res.data} students.`)
      } else {
        toast('error', 'Failed to Save Attendance', res.error || 'Could not save attendance records.')
      }
    } finally {
      setIsSavingAttendance(false)
    }
  }

  // Save Chalkboard Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      const res = await saveOfflineSessionNotesAction(session.id, notes)
      if (res.success) {
        setNotesSaved(true)
        toast('success', 'Notes Saved', 'Chalkboard and agenda notes updated.')
      } else {
        toast('error', 'Failed to Save Notes', res.error || 'Could not save lesson notes.')
      }
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb / Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link
            href="/dashboard"
            className="hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <Link
            href={`/dashboard/batches/${session.batch_id}`}
            className="hover:text-gray-900 transition-colors"
          >
            {session.batch?.name}
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="text-gray-900 font-semibold">Physical Class</span>
        </div>

        <Badge variant="warning">
          Offline Classroom
        </Badge>
      </div>

      {/* Main Class Header Card */}
      <Card className="border-gray-200/80 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
        <CardBody className="p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {session.batch?.name}
                </h1>
                {session.batch?.subject && (
                  <Badge variant="default">
                    {session.batch.subject}
                  </Badge>
                )}
                {currentStatus === 'in_progress' && (
                  <Badge className="bg-emerald-500 text-white animate-pulse">
                    ● Live In-Person Class
                  </Badge>
                )}
                {currentStatus === 'completed' && (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Completed
                  </Badge>
                )}
                {currentStatus === 'scheduled' && (
                  <Badge variant="default">
                    Scheduled
                  </Badge>
                )}
              </div>

              {/* Class metadata: Location, Date, Time */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1.5 font-medium text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    {session.location || session.batch?.location || 'Physical Classroom / Center'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{session.session_date}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>
                    {formatTime12Hour(session.start_time)} – {formatTime12Hour(session.end_time)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifecycle Status Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              {currentStatus === 'scheduled' && (
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold text-xs sm:text-sm h-10 px-4"
                >
                  <Play className="h-4 w-4 mr-1.5 fill-current" />
                  Start Class
                </Button>
              )}

              {currentStatus === 'in_progress' && (
                <Button
                  onClick={() => handleStatusChange('completed')}
                  disabled={isPending}
                  className="bg-gray-900 hover:bg-black text-white shadow-sm font-semibold text-xs sm:text-sm h-10 px-4"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                  End Class
                </Button>
              )}

              {currentStatus === 'completed' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isPending}
                  className="text-xs h-9"
                >
                  Re-open Session
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid: Left column (1-Click Attendance), Right column (Chalkboard & Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 1-Click Fast Attendance Roster (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-600" />
                  Class Attendance Roster
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  1-click roster for physical classroom roll call.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  className="text-xs font-medium h-8"
                >
                  Mark All Present
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance || enrolledStudents.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {isSavingAttendance ? 'Saving...' : attendanceSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-4 sm:p-5 space-y-4">
              {/* Summary stat pills */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-gray-500 font-medium">Total</div>
                  <div className="text-base font-bold text-gray-900">{attendanceCounts.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-emerald-700 font-medium">Present</div>
                  <div className="text-base font-bold text-emerald-700">{attendanceCounts.present}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="text-rose-700 font-medium">Absent</div>
                  <div className="text-base font-bold text-rose-700">{attendanceCounts.absent}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-amber-700 font-medium">Late</div>
                  <div className="text-base font-bold text-amber-700">{attendanceCounts.late}</div>
                </div>
              </div>

              {/* Student Roster List */}
              {enrolledStudents.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  No students currently enrolled in this batch.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {enrolledStudents.map(({ student }) => {
                    const rec = records[student.id] || { status: 'present', note: '' }
                    const status = rec.status

                    return (
                      <div
                        key={student.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Student info */}
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-semibold text-gray-900">
                              {student.full_name}
                            </div>
                            {student.phone && (
                              <div className="text-[11px] text-gray-400">{student.phone}</div>
                            )}
                          </div>
                        </div>

                        {/* 1-click status pill selector */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleStudentStatus(student.id, 'present')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudentStatus(student.id, 'late')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              status === 'late'
                                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudentStatus(student.id, 'absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              status === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Link to full attendance management */}
              <div className="pt-2 flex justify-end">
                <Link
                  href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  Full Attendance Sheet & Notes →
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Chalkboard Notes & Batch Shortcuts (Span 1) */}
        <div className="space-y-6">
          {/* Lesson Agenda / Chalkboard Notes */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  Chalkboard & Notes
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lesson coverage & physical notes.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-xs h-7 px-2.5"
              >
                {isSavingNotes ? 'Saving...' : notesSaved ? 'Saved' : 'Save'}
              </Button>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              <Textarea
                placeholder="Topics covered today, chalkboard points, homework assigned, or announcements..."
                rows={6}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setNotesSaved(false)
                }}
                className="text-xs leading-relaxed resize-none"
              />
              <p className="text-[11px] text-gray-400">
                Notes saved here will be visible on the session summary and in the parent portal.
              </p>
            </CardBody>
          </Card>

          {/* Quick Shortcuts for Physical Class */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Session Shortcuts
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-2 text-xs">
              <Link
                href={`/dashboard/homework/new?batchId=${session.batch_id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <span>Assign Homework</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>

              <Link
                href={`/dashboard/tests/new?batchId=${session.batch_id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Schedule / Create Test</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>

              <Link
                href={`/dashboard/batches/${session.batch_id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="h-4 w-4 text-gray-500" />
                  <span>View Batch Details</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
