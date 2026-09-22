'use client'

import React, { useState } from 'react'
import {
  CalendarCheck,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react'
import type { StudentAttendanceItem, StudentHomeworkItem, StudentTestItem } from '@/lib/student-portal'

interface StudentProgressClientProps {
  attendance: {
    records: StudentAttendanceItem[]
    stats: {
      totalClasses: number
      presentCount: number
      absentCount: number
      lateCount: number
      attendancePercentage: number | null
    }
  }
  homework: StudentHomeworkItem[]
  tests: StudentTestItem[]
}

export function StudentProgressClient({ attendance, homework, tests }: StudentProgressClientProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'late' | 'absent'>('all')

  const { records, stats } = attendance
  const filteredRecords = records.filter((r) => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  // Homework metrics
  const completedHwCount = homework.filter((h) => h.student_status === 'Completed').length
  const hwCompletionRate =
    homework.length > 0 ? Math.round((completedHwCount / homework.length) * 100) : 100

  // Tests metrics
  const gradedTests = tests.filter((t) => t.percentage !== null)
  const averageTestScore =
    gradedTests.length > 0
      ? Math.round(gradedTests.reduce((acc, t) => acc + (t.percentage || 0), 0) / gradedTests.length)
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Academic Progress & Attendance</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Comprehensive overview of your class attendance consistency, assignment completion, and test marks
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance Rate */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Attendance Consistency</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">
            {stats.attendancePercentage !== null ? `${stats.attendancePercentage}%` : '100%'}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
            <span>{stats.presentCount} Present</span>
            <span>{stats.lateCount} Late</span>
            <span>{stats.absentCount} Absent</span>
          </div>
        </div>

        {/* Homework Completion */}
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Homework Completion</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">{hwCompletionRate}%</p>
          <p className="mt-3 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
            {completedHwCount} of {homework.length} assignments completed
          </p>
        </div>

        {/* Test Average */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Test Score Average</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">
            {averageTestScore !== null ? `${averageTestScore}%` : 'N/A'}
          </p>
          <p className="mt-3 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
            Across {gradedTests.length} evaluated tests & quizzes
          </p>
        </div>
      </div>

      {/* Attendance History Section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-indigo-600" />
              Class Attendance Records
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Verified attendance logs recorded by your instructors (read-only)
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('present')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === 'present'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Present ({stats.presentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('late')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === 'late'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Late ({stats.lateCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('absent')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === 'absent'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Absent ({stats.absentCount})
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">No attendance records found</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Attendance marked during your live or offline classes will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold text-[11px]">
                  <th className="pb-3 pl-1 font-semibold">DATE</th>
                  <th className="pb-3 font-semibold">BATCH</th>
                  <th className="pb-3 font-semibold">TUTOR</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 pr-1 text-right font-semibold">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pl-1 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(r.attendance_date).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 font-semibold text-indigo-600 whitespace-nowrap">
                      {r.batch_name}
                    </td>
                    <td className="py-3 text-gray-600 whitespace-nowrap">{r.tutor_name}</td>
                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          r.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status === 'present' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : r.status === 'late' ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span className="capitalize">{r.status}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-1 text-right text-gray-400 max-w-xs truncate">
                      {r.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span>Attendance logs are maintained securely by your course tutors and can only be altered by authorized instructors.</span>
        </div>
      </div>
    </div>
  )
}
