'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Trash2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { HomeworkStatusBadge } from './homework-status-badge'
import { HomeworkProgressBar } from './homework-progress-bar'
import { useToast } from '@/contexts/toast-context'
import {
  updateStudentHomeworkStatusAction,
  bulkUpdateHomeworkStatusAction,
  deleteHomeworkAction,
} from '@/app/(dashboard)/dashboard/homework/actions'
import type { HomeworkWithDetails, HomeworkStudentWithDetails } from '@/types'

interface HomeworkDetailsClientProps {
  homework: HomeworkWithDetails
}

export function HomeworkDetailsClient({ homework }: HomeworkDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [students, setStudents] = useState<HomeworkStudentWithDetails[]>(homework.students || [])
  const [isBulkCompletedOpen, setIsBulkCompletedOpen] = useState(false)
  const [isBulkPendingOpen, setIsBulkPendingOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const formattedAssigned = new Date(homework.assigned_date).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedDue = homework.due_date
    ? new Date(homework.due_date).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date'

  async function handleToggleStatus(item: HomeworkStudentWithDetails) {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed'
    try {
      const res = await updateStudentHomeworkStatusAction(item.id, nextStatus)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Could not update status.')
        return
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? {
                ...s,
                status: nextStatus,
                completed_at: nextStatus === 'Completed' ? new Date().toISOString() : null,
              }
            : s
        )
      )

      toast('success', 'Updated', `${item.student.full_name} marked as ${nextStatus}.`)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    }
  }

  async function handleBulkCompleted() {
    setIsActionLoading(true)
    try {
      const res = await bulkUpdateHomeworkStatusAction(homework.id, 'Completed')
      if (!res.success) {
        toast('error', 'Error', res.error || 'Could not update all students.')
        return
      }
      toast('success', 'Completed', 'All students marked as Completed.')
      setIsBulkCompletedOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleBulkPending() {
    setIsActionLoading(true)
    try {
      const res = await bulkUpdateHomeworkStatusAction(homework.id, 'Pending')
      if (!res.success) {
        toast('error', 'Error', res.error || 'Could not reset students.')
        return
      }
      toast('success', 'Reset', 'All student records marked as Pending.')
      setIsBulkPendingOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleDelete() {
    setIsActionLoading(true)
    try {
      const res = await deleteHomeworkAction(homework.id)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Could not delete homework.')
        return
      }
      toast('success', 'Deleted', 'Homework assignment deleted.')
      router.push('/dashboard/homework')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Assigned</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {homework.total_assigned}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center">
          <p className="text-xs text-green-700 font-medium">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-green-800 mt-1">
            {homework.completed_count}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 text-center">
          <p className="text-xs text-yellow-700 font-medium">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-800 mt-1">
            {homework.pending_count}
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-center">
          <p className="text-xs text-indigo-700 font-medium">Completion Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-800 mt-1">
            {homework.completion_rate}%
          </p>
        </div>
      </div>

      {/* Progress Bar Card */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <HomeworkProgressBar
            completed={homework.completed_count}
            total={homework.total_assigned}
            rate={homework.completion_rate}
          />
        </CardBody>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Homework Details Card */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{homework.title}</h2>
                <HomeworkStatusBadge status={homework.display_status} />
              </div>
            </CardHeader>
            <CardBody className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <Layers className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Batch</p>
                  <Link
                    href={`/dashboard/batches/${homework.batch_id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {homework.batch?.name}
                  </Link>
                  {homework.batch?.class_name && (
                    <p className="text-xs text-gray-400">{homework.batch.class_name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Assigned Date</p>
                  <p className="font-medium text-gray-800">{formattedAssigned}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-800">{formattedDue}</p>
                </div>
              </div>

              {homework.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{homework.description}</p>
                </div>
              )}

              {homework.instructions && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Instructions / Guidelines</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {homework.instructions}
                  </p>
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
            <span>Delete Homework</span>
          </Button>
        </div>

        {/* Right Column: Assigned Students Roster */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Student Completion Roster</h3>
                <p className="text-xs text-gray-500">Tap to toggle homework completion status.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBulkCompletedOpen(true)}
                  disabled={students.length === 0}
                  className="text-xs"
                >
                  Mark All Completed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBulkPendingOpen(true)}
                  disabled={students.length === 0}
                  className="text-xs text-gray-500"
                >
                  Reset All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {students.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No students assigned</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    This batch had no enrolled students when the homework was created. Add students to the batch to assign tasks.
                  </p>
                  <Link href={`/dashboard/batches/${homework.batch_id}`}>
                    <Button size="sm" className="mt-4">
                      Manage Batch Students
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((item, idx) => {
                    const isCompleted = item.status === 'Completed'
                    const completedDate = item.completed_at
                      ? new Date(item.completed_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : null

                    return (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/75 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {idx + 1}
                          </span>
                          <div>
                            <Link
                              href={`/dashboard/students/${item.student_id}`}
                              className="font-semibold text-gray-900 text-sm hover:text-indigo-600 hover:underline"
                            >
                              {item.student.full_name}
                            </Link>
                            {item.student.class_name && (
                              <p className="text-xs text-gray-400">{item.student.class_name}</p>
                            )}
                            {isCompleted && completedDate && (
                              <p className="text-[11px] text-green-600 mt-0.5">
                                Completed on {completedDate}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Toggle Action Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] min-w-[120px] justify-center border ${
                            isCompleted
                              ? 'bg-green-600 border-green-600 text-white shadow-xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              <span>Mark Done</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Bulk Mark Completed Confirmation */}
      <Dialog
        isOpen={isBulkCompletedOpen}
        onClose={() => setIsBulkCompletedOpen(false)}
        title="Mark All Completed?"
        description="This will mark all students in this batch as having completed the homework."
        confirmLabel="Mark All Completed"
        isLoading={isActionLoading}
        onConfirm={handleBulkCompleted}
      />

      {/* Bulk Reset Pending Confirmation */}
      <Dialog
        isOpen={isBulkPendingOpen}
        onClose={() => setIsBulkPendingOpen(false)}
        title="Reset All to Pending?"
        description="This will revert all student completion statuses back to Pending."
        confirmLabel="Reset to Pending"
        confirmVariant="danger"
        isLoading={isActionLoading}
        onConfirm={handleBulkPending}
      />

      {/* Delete Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Homework Assignment?"
        description={`Are you sure you want to delete "${homework.title}"? All student tracking records will be removed.`}
        confirmLabel="Delete Homework"
        confirmVariant="danger"
        isLoading={isActionLoading}
        onConfirm={handleDelete}
      />
    </div>
  )
}
