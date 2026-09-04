'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Layers,
  Award,
  Users,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { TestStatusBadge } from './test-status-badge'
import { TestGradeBadge } from './test-grade-badge'
import {
  calculatePercentage,
  calculateGrade,
  calculateTestStats,
} from '@/lib/test-utils'
import { useToast } from '@/contexts/toast-context'
import { saveTestMarksAction, deleteTestAction } from '@/app/(dashboard)/dashboard/tests/actions'
import type { TestWithDetails, TestMarkWithDetails } from '@/types'

interface TestMarkEntryProps {
  test: TestWithDetails
}

interface MarkInputState {
  id: string
  student_id: string
  student_name: string
  class_name: string | null
  marks: string
  status: 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
  remarks: string
  error?: string
}

export function TestMarkEntry({ test }: TestMarkEntryProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Local editable state for each student row
  const [rowStates, setRowStates] = useState<MarkInputState[]>(() => {
    return (test.marks || []).map((m: TestMarkWithDetails) => ({
      id: m.id,
      student_id: m.student_id,
      student_name: m.student.full_name,
      class_name: m.student.class_name,
      marks: m.marks !== null ? String(m.marks) : '',
      status: m.status,
      remarks: m.remarks || '',
    }))
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Real-time live stats calculated across current input states
  const liveStats = useMemo(() => {
    const virtualList = rowStates.map((r) => {
      const parsed = parseFloat(r.marks)
      return {
        marks: !isNaN(parsed) && r.status === 'Graded' ? parsed : null,
        status: r.status,
      }
    })
    return calculateTestStats(virtualList, test.max_marks)
  }, [rowStates, test.max_marks])

  const formattedDate = new Date(test.test_date).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  function handleMarksChange(index: number, val: string) {
    setRowStates((prev) => {
      const next = [...prev]
      const row = { ...next[index] }
      row.marks = val

      if (val.trim() === '') {
        row.status = 'Not Graded'
        row.error = undefined
      } else {
        const num = parseFloat(val)
        if (isNaN(num)) {
          row.error = 'Invalid number'
        } else if (num < 0) {
          row.error = 'Cannot be negative'
        } else if (num > test.max_marks) {
          row.error = `Max ${test.max_marks}`
        } else {
          row.status = 'Graded'
          row.error = undefined
        }
      }
      next[index] = row
      return next
    })
    setHasChanges(true)
  }

  function handleStatusChange(index: number, status: 'Not Graded' | 'Graded' | 'Absent' | 'Excused') {
    setRowStates((prev) => {
      const next = [...prev]
      const row = { ...next[index] }
      row.status = status
      if (status === 'Absent' || status === 'Excused') {
        row.marks = ''
        row.error = undefined
      }
      next[index] = row
      return next
    })
    setHasChanges(true)
  }

  async function handleSaveMarks() {
    // Check if any row has validation error
    const hasError = rowStates.some((r) => !!r.error)
    if (hasError) {
      toast('error', 'Validation Error', 'Please fix errors before saving.')
      return
    }

    setSaving(true)
    try {
      const payload = rowStates.map((r) => ({
        id: r.id,
        marks: r.status === 'Graded' && r.marks.trim() !== '' ? parseFloat(r.marks) : null,
        status: r.status,
        remarks: r.remarks.trim() || null,
      }))

      const res = await saveTestMarksAction(test.id, payload)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to save marks.')
        return
      }

      toast('success', 'Marks Saved', 'All student marks saved successfully.')
      setHasChanges(false)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong while saving marks.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTest() {
    setIsActionLoading(true)
    try {
      const res = await deleteTestAction(test.id)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Could not delete test.')
        return
      }
      toast('success', 'Deleted', 'Test and marks records removed.')
      router.push('/dashboard/tests')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 5 Real-Time Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-center">
          <p className="text-xs text-gray-500 font-medium">Students</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {liveStats.total_students}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {liveStats.graded_count} Graded • {liveStats.ungraded_count} Pending
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-center">
          <p className="text-xs text-indigo-700 font-medium">Class Average</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-800 mt-1">
            {liveStats.average_percentage !== null ? `${liveStats.average_percentage}%` : '—'}
          </p>
          <p className="text-[10px] text-indigo-600 mt-0.5">
            {liveStats.average_marks !== null ? `${liveStats.average_marks} / ${test.max_marks}` : 'No marks yet'}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50/50 p-3.5 text-center">
          <p className="text-xs text-green-700 font-medium">Highest Score</p>
          <p className="text-xl sm:text-2xl font-bold text-green-800 mt-1">
            {liveStats.highest_marks !== null ? liveStats.highest_marks : '—'}
          </p>
          <p className="text-[10px] text-green-600 mt-0.5">
            {liveStats.highest_marks !== null
              ? `${calculatePercentage(liveStats.highest_marks, test.max_marks)}%`
              : 'Out of ' + test.max_marks}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-3.5 text-center">
          <p className="text-xs text-yellow-700 font-medium">Lowest Score</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-800 mt-1">
            {liveStats.lowest_marks !== null ? liveStats.lowest_marks : '—'}
          </p>
          <p className="text-[10px] text-yellow-600 mt-0.5">
            {liveStats.lowest_marks !== null
              ? `${calculatePercentage(liveStats.lowest_marks, test.max_marks)}%`
              : 'Out of ' + test.max_marks}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-blue-700 font-medium">Class Grade</p>
          <div className="mt-1 flex items-center justify-center">
            <TestGradeBadge grade={calculateGrade(liveStats.average_percentage)} />
          </div>
          <p className="text-[10px] text-blue-600 mt-0.5">Overall Performance</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Test Details Card */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{test.title}</h2>
                <TestStatusBadge status={test.display_status} />
              </div>
            </CardHeader>
            <CardBody className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <Layers className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Batch</p>
                  <Link
                    href={`/dashboard/batches/${test.batch_id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {test.batch?.name}
                  </Link>
                  {test.batch?.class_name && (
                    <p className="text-xs text-gray-400">{test.batch.class_name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Test Date</p>
                  <p className="font-medium text-gray-800">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Award className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Maximum Marks</p>
                  <p className="font-bold text-gray-900">{test.max_marks}</p>
                </div>
              </div>

              {test.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Topics / Syllabus</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{test.description}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Delete Danger Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Test</span>
          </Button>
        </div>

        {/* Right Column: Marks Entry Roster */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Student Marks Entry</h3>
                <p className="text-xs text-gray-500">
                  Type marks below (Out of {test.max_marks}). Percentage & grade update instantly.
                </p>
              </div>
              <Button
                size="md"
                onClick={handleSaveMarks}
                loading={saving}
                disabled={!hasChanges && !saving}
                className="gap-1.5 shadow-xs"
              >
                <Save className="h-4 w-4" />
                <span>Save Marks</span>
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {rowStates.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No students enrolled</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    This batch had no enrolled students when the test was scheduled. Add students to the batch to grade them.
                  </p>
                  <Link href={`/dashboard/batches/${test.batch_id}`}>
                    <Button size="sm" className="mt-4">
                      Manage Batch Students
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 font-medium text-gray-600">
                      <tr>
                        <th scope="col" className="px-4 py-3">#</th>
                        <th scope="col" className="px-4 py-3">Student</th>
                        <th scope="col" className="px-4 py-3 w-32">Marks (/{test.max_marks})</th>
                        <th scope="col" className="px-3 py-3 text-center">Status</th>
                        <th scope="col" className="px-3 py-3 text-center">Percentage</th>
                        <th scope="col" className="px-3 py-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {rowStates.map((row, idx) => {
                        const parsed = parseFloat(row.marks)
                        const pct =
                          !isNaN(parsed) && row.status === 'Graded'
                            ? calculatePercentage(parsed, test.max_marks)
                            : null
                        const grade = calculateGrade(pct)

                        return (
                          <tr key={row.id} className="hover:bg-gray-50/75 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/dashboard/students/${row.student_id}`}
                                className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline text-sm"
                              >
                                {row.student_name}
                              </Link>
                              {row.class_name && (
                                <p className="text-[11px] text-gray-400">{row.class_name}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max={test.max_marks}
                                  placeholder="—"
                                  value={row.marks}
                                  disabled={row.status === 'Absent' || row.status === 'Excused'}
                                  onChange={(e) => handleMarksChange(idx, e.target.value)}
                                  className={`w-24 px-2.5 py-1.5 text-sm font-semibold rounded-lg border outline-none transition-all ${
                                    row.error
                                      ? 'border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-200'
                                      : 'border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                                  } ${
                                    row.status === 'Absent' || row.status === 'Excused'
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-white'
                                  }`}
                                />
                                {row.error && (
                                  <p className="text-[10px] text-red-600 mt-0.5 whitespace-nowrap">
                                    {row.error}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              <select
                                value={row.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    idx,
                                    e.target.value as 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
                                  )
                                }
                                className="text-xs py-1 px-2 rounded border border-gray-200 bg-white font-medium text-gray-700 outline-none focus:border-indigo-600"
                              >
                                <option value="Not Graded">Not Graded</option>
                                <option value="Graded">Graded</option>
                                <option value="Absent">Absent</option>
                                <option value="Excused">Excused</option>
                              </select>
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              {row.status === 'Absent' ? (
                                <span className="text-xs text-red-500 font-medium">Absent</span>
                              ) : row.status === 'Excused' ? (
                                <span className="text-xs text-gray-400 font-medium">Excused</span>
                              ) : pct !== null ? (
                                <span className="font-semibold text-gray-900 text-sm">{pct}%</span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              {row.status === 'Absent' || row.status === 'Excused' ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : (
                                <TestGradeBadge grade={grade} />
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Test & Marks?"
        description={`Are you sure you want to delete "${test.title}"? All student marks records for this test will be removed.`}
        confirmLabel="Delete Test"
        confirmVariant="danger"
        isLoading={isActionLoading}
        onConfirm={handleDeleteTest}
      />
    </div>
  )
}
