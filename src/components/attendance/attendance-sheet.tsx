'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Users,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/contexts/toast-context'
import { saveAttendanceAction } from '@/app/(dashboard)/dashboard/attendance/actions'
import type { BatchWithCount, EnrolledStudent, Attendance, AttendanceStatus } from '@/types'

interface AttendanceSheetProps {
  batches: BatchWithCount[]
  selectedBatchId?: string
  initialDate?: string
  enrolledStudents: EnrolledStudent[]
  existingAttendance: Attendance[]
}

function buildInitialRecords(
  enrolledStudents: EnrolledStudent[],
  existingAttendance: Attendance[]
): Record<string, { status: AttendanceStatus; note: string }> {
  const map: Record<string, { status: AttendanceStatus; note: string }> = {}
  const existingMap = new Map(existingAttendance.map((a) => [a.student_id, a]))

  for (const { student } of enrolledStudents) {
    const existing = existingMap.get(student.id)
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

export function AttendanceSheet({
  batches,
  selectedBatchId: initialBatchId,
  initialDate,
  enrolledStudents,
  existingAttendance,
}: AttendanceSheetProps) {
  const router = useRouter()
  const { toast } = useToast()

  const todayStr = useMemo(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }, [])

  const [batchId, setBatchId] = useState(initialBatchId || (batches[0]?.id ?? ''))
  const [date, setDate] = useState(initialDate || todayStr)
  const [saving, setSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(existingAttendance.length > 0)

  // Initialize records from props directly without effect
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() =>
    buildInitialRecords(enrolledStudents, existingAttendance)
  )

  // Count stats
  const stats = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    for (const item of Object.values(records)) {
      if (item.status === 'present') present++
      else if (item.status === 'absent') absent++
      else if (item.status === 'late') late++
    }
    return { total: enrolledStudents.length, present, absent, late }
  }, [records, enrolledStudents])

  function setStudentStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }))
  }

  function markAll(status: AttendanceStatus) {
    setRecords((prev) => {
      const updated = { ...prev }
      for (const { student } of enrolledStudents) {
        updated[student.id] = {
          ...updated[student.id],
          status,
        }
      }
      return updated
    })
  }

  async function handleSave() {
    if (!batchId) {
      toast('error', 'Select Batch', 'Please choose a batch first.')
      return
    }

    setSaving(true)
    try {
      const entries = enrolledStudents.map(({ student }) => ({
        student_id: student.id,
        status: records[student.id]?.status || 'present',
        note: records[student.id]?.note || null,
      }))

      const res = await saveAttendanceAction(batchId, date, entries)

      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not save attendance.')
        return
      }

      setHasSaved(true)
      toast('success', 'Attendance Saved', `Recorded attendance for ${entries.length} students on ${date}.`)
    } catch {
      toast('error', 'Error', 'Something went wrong while saving attendance.')
    } finally {
      setSaving(false)
    }
  }

  function handleBatchChange(newBatchId: string) {
    setBatchId(newBatchId)
    router.push(`/dashboard/attendance?batch=${newBatchId}&date=${date}`)
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    router.push(`/dashboard/attendance?batch=${batchId}&date=${newDate}`)
  }

  if (batches.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-indigo-500" />}
        title="No batches available"
        description="Create a batch and enroll students before taking attendance."
        action={
          <Link href="/dashboard/batches/new">
            <Button size="md" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create First Batch</span>
            </Button>
          </Link>
        }
      />
    )
  }

  const selectedBatch = batches.find((b) => b.id === batchId)

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Panel */}
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label htmlFor="batch-select" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Batch
            </label>
            <Select
              id="batch-select"
              value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.student_count} students)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="date-select" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <Input
                id="date-select"
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center justify-start sm:justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAll('present')}
              disabled={enrolledStudents.length === 0}
              className="text-xs"
            >
              Mark All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAll('absent')}
              disabled={enrolledStudents.length === 0}
              className="text-xs text-red-600 hover:bg-red-50"
            >
              Mark All Absent
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-center">
          <p className="text-xs text-gray-500 font-medium">Total Enrolled</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-3.5 text-center">
          <p className="text-xs text-green-700 font-medium">Present</p>
          <p className="text-xl font-bold text-green-800 mt-0.5">{stats.present}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 text-center">
          <p className="text-xs text-red-700 font-medium">Absent</p>
          <p className="text-xl font-bold text-red-800 mt-0.5">{stats.absent}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-3.5 text-center">
          <p className="text-xs text-yellow-700 font-medium">Late</p>
          <p className="text-xl font-bold text-yellow-800 mt-0.5">{stats.late}</p>
        </div>
      </div>

      {hasSaved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 text-xs">
          <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
          <span>Attendance is already saved for this date. Modifying any status and clicking Save will update the record.</span>
        </div>
      )}

      {/* Attendance Student Roster Sheet */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {selectedBatch ? selectedBatch.name : 'Batch'} Roster
            </h3>
            <p className="text-xs text-gray-500">
              Tap buttons below to mark status for {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Button
            size="md"
            loading={saving}
            onClick={handleSave}
            disabled={enrolledStudents.length === 0}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            <span>{hasSaved ? 'Update Attendance' : 'Save Attendance'}</span>
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {enrolledStudents.length === 0 ? (
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-yellow-500" />}
              title="No students in this batch"
              description="Add students to this batch before marking attendance."
              action={
                <Link href={`/dashboard/batches/${batchId}`}>
                  <Button size="md" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Manage Batch Students</span>
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {enrolledStudents.map(({ student }, idx) => {
                const currentStatus = records[student.id]?.status || 'present'

                return (
                  <div
                    key={student.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/75 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="font-semibold text-gray-900 text-sm hover:text-indigo-600 hover:underline"
                        >
                          {student.full_name}
                        </Link>
                        {student.class_name && (
                          <p className="text-xs text-gray-500">{student.class_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Touch Friendly Attendance Pill Selector */}
                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'present')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] min-w-[90px] border ${
                          currentStatus === 'present'
                            ? 'bg-green-600 border-green-600 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'absent')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] min-w-[90px] border ${
                          currentStatus === 'absent'
                            ? 'bg-red-600 border-red-600 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200'
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'late')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] min-w-[90px] border ${
                          currentStatus === 'late'
                            ? 'bg-yellow-500 border-yellow-500 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-yellow-50 hover:border-yellow-200'
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                        <span>Late</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Floating/Bottom Save Bar on Mobile */}
      {enrolledStudents.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            loading={saving}
            onClick={handleSave}
            className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-5 w-5" />
            <span>{hasSaved ? 'Update Attendance' : 'Save Attendance'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
