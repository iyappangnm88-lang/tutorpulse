'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Check,
  RotateCcw,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleHomeworkStatusAction } from '@/app/student/actions'
import type { StudentHomeworkItem } from '@/lib/student-portal'

interface StudentHomeworkClientProps {
  initialHomework: StudentHomeworkItem[]
}

type TabFilter = 'all' | 'pending' | 'completed' | 'overdue'

export function StudentHomeworkClient({ initialHomework }: StudentHomeworkClientProps) {
  const router = useRouter()
  const [homeworkList, setHomeworkList] = useState<StudentHomeworkItem[]>(initialHomework)
  const [currentTab, setCurrentTab] = useState<TabFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pendingCount = homeworkList.filter((h) => h.student_status === 'Pending' && !h.is_overdue).length
  const completedCount = homeworkList.filter((h) => h.student_status === 'Completed').length
  const overdueCount = homeworkList.filter((h) => h.is_overdue).length

  const filtered = homeworkList.filter((h) => {
    if (currentTab === 'pending') return h.student_status === 'Pending' && !h.is_overdue
    if (currentTab === 'completed') return h.student_status === 'Completed'
    if (currentTab === 'overdue') return h.is_overdue
    return true
  })

  async function handleToggleStatus(hwId: string, currentStatus: string) {
    const isNowCompleted = currentStatus !== 'Completed'
    setLoadingId(hwId)
    setError(null)

    // Optimistic update
    setHomeworkList((prev) =>
      prev.map((h) => {
        if (h.id === hwId) {
          return {
            ...h,
            student_status: isNowCompleted ? 'Completed' : 'Pending',
            is_overdue: isNowCompleted ? false : h.due_date ? new Date(h.due_date) < new Date() : false,
            completed_at: isNowCompleted ? new Date().toISOString() : null,
          }
        }
        return h
      })
    )

    const res = await toggleHomeworkStatusAction(hwId, isNowCompleted)
    setLoadingId(null)

    if (!res.success) {
      setError(res.error || 'Failed to update homework status.')
      // Rollback
      setHomeworkList(initialHomework)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Homework & Assignments</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track and complete assigned worksheets, reading tasks, and exercises
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'all' ? 'bg-indigo-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {homeworkList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('pending')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Completed
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'completed' ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {completedCount}
          </span>
        </button>

        {overdueCount > 0 && (
          <button
            type="button"
            onClick={() => setCurrentTab('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Overdue
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                currentTab === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {overdueCount}
            </span>
          </button>
        )}
      </div>

      {/* Homework List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {currentTab === 'completed'
              ? 'No completed assignments yet'
              : currentTab === 'overdue'
              ? 'No overdue homework! Great job!'
              : currentTab === 'pending'
              ? 'No pending homework!'
              : 'No homework assigned'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {currentTab === 'completed'
              ? 'Once you complete your assignments, toggle them as completed to keep track.'
              : 'When your tutors assign worksheets, readings, or questions, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hw) => {
            const isExpanded = expandedId === hw.id
            const isLoading = loadingId === hw.id
            const isCompleted = hw.student_status === 'Completed'

            return (
              <div
                key={hw.id}
                className={`rounded-2xl border bg-white p-5 shadow-2xs transition-all ${
                  isCompleted
                    ? 'border-gray-100 bg-gray-50/30'
                    : hw.is_overdue
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-gray-100 hover:border-indigo-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-600">{hw.batch_name}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">Tutor: {hw.tutor_name}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due:{' '}
                        {hw.due_date
                          ? new Date(hw.due_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No deadline'}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold ${
                        isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {hw.title}
                    </h3>

                    {hw.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{hw.description}</p>
                    )}

                    {/* Expandable Instructions */}
                    {(hw.instructions || (hw.description && hw.description.length > 80)) && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : hw.id)}
                          className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {isExpanded ? 'Hide Full Details' : 'View Instructions & Notes'}
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 rounded-xl bg-gray-50 p-4 border border-gray-100 text-xs text-gray-700 space-y-2">
                            {hw.description && (
                              <div>
                                <p className="font-semibold text-gray-900 mb-0.5">Overview:</p>
                                <p className="whitespace-pre-line text-gray-600">{hw.description}</p>
                              </div>
                            )}
                            {hw.instructions && (
                              <div className="pt-2 border-t border-gray-200">
                                <p className="font-semibold text-gray-900 mb-0.5">Instructions:</p>
                                <p className="whitespace-pre-line text-gray-600">{hw.instructions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : hw.is_overdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </>
                      ) : hw.is_overdue ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Pending
                        </>
                      )}
                    </span>

                    <Button
                      size="sm"
                      variant={isCompleted ? 'outline' : 'primary'}
                      onClick={() => handleToggleStatus(hw.id, hw.student_status)}
                      disabled={isLoading}
                      className={`text-xs h-8 ${
                        isCompleted
                          ? 'text-gray-600 hover:text-gray-900'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isCompleted ? (
                        <>
                          <RotateCcw className="mr-1.5 h-3 w-3" />
                          Mark as Pending
                        </>
                      ) : (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Mark as Done
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
