'use client'

import React, { useState } from 'react'
import {
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'
import type { StudentTestItem } from '@/lib/student-portal'

interface StudentTestsClientProps {
  initialTests: StudentTestItem[]
}

type TabFilter = 'all' | 'graded' | 'upcoming'

export function StudentTestsClient({ initialTests }: StudentTestsClientProps) {
  const [currentTab, setCurrentTab] = useState<TabFilter>('all')

  const gradedCount = initialTests.filter((t) => t.marks !== null).length
  const upcomingCount = initialTests.filter((t) => t.status === 'Upcoming').length

  const filtered = initialTests.filter((t) => {
    if (currentTab === 'graded') return t.marks !== null
    if (currentTab === 'upcoming') return t.status === 'Upcoming'
    return true
  })

  // Calculate student average percentage across graded tests
  const gradedTests = initialTests.filter((t) => t.percentage !== null)
  const averagePercentage =
    gradedTests.length > 0
      ? Math.round(gradedTests.reduce((acc, t) => acc + (t.percentage || 0), 0) / gradedTests.length)
      : null

  function getGradeColor(grade: string | null) {
    if (!grade) return 'bg-gray-100 text-gray-700'
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-rose-100 text-rose-800 border-rose-200'
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tests & Marks</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View scheduled tests, evaluated quiz marks, and tutor remarks
          </p>
        </div>

        {averagePercentage !== null && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800">
              Average Score: <strong>{averagePercentage}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setCurrentTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Tests
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'all' ? 'bg-indigo-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {initialTests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('graded')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'graded'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Graded & Evaluated
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'graded' ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {gradedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('upcoming')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Upcoming
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'upcoming' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {upcomingCount}
          </span>
        </button>
      </div>

      {/* Tests Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {currentTab === 'graded'
              ? 'No graded test scores recorded yet'
              : currentTab === 'upcoming'
              ? 'No upcoming tests scheduled'
              : 'No tests found'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When your tutors schedule exams or publish marks, they will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((test) => {
            const isGraded = test.marks !== null

            return (
              <div
                key={test.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs hover:border-indigo-100 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-indigo-600">{test.batch_name}</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      {test.test_date
                        ? new Date(test.test_date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Date TBA'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900">{test.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Tutor: {test.tutor_name}</p>

                  {test.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{test.description}</p>
                  )}

                  {/* Teacher Feedback / Remarks */}
                  {test.remarks && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50/70 border border-amber-100 p-2.5 text-xs text-amber-900">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-semibold">Instructor Remarks:</span> {test.remarks}
                      </div>
                    </div>
                  )}
                </div>

                {/* Score Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {isGraded ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-gray-900">
                        {test.marks} / {test.max_marks}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        ({test.percentage}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {test.status === 'Upcoming' ? 'Exam scheduled' : 'Evaluation pending'}
                    </span>
                  )}

                  {isGraded && test.grade ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getGradeColor(
                        test.grade
                      )}`}
                    >
                      Grade {test.grade}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {test.status}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
