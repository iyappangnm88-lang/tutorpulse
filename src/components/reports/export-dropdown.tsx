'use client'

import React, { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import type { ReportAggregatedData } from '@/types'

export function ExportDropdown({ data }: { data: ReportAggregatedData }) {
  const [open, setOpen] = useState(false)

  function exportStudents() {
    const headers = ['Student Name', 'Class', 'Attendance %', 'Status']
    const rows = data.attendanceRows.map((r) => [r.student_name, r.class_name || '—', `${r.percentage}%`, r.status])
    downloadCsv('students-report', headers, rows)
    setOpen(false)
  }

  function exportAttendance() {
    const headers = ['Student Name', 'Batch', 'Total Sessions', 'Present', 'Absent', 'Attendance %', 'Status']
    const rows = data.attendanceRows.map((r) => [
      r.student_name,
      r.batch_name || '—',
      r.total_sessions,
      r.present,
      r.absent,
      `${r.percentage}%`,
      r.status,
    ])
    downloadCsv('attendance-report', headers, rows)
    setOpen(false)
  }

  function exportTests() {
    const headers = ['Student Name', 'Tests Taken', 'Average %', 'Highest %', 'Grade']
    const rows = data.performanceRows.map((r) => [
      r.student_name,
      r.tests_taken,
      r.average_percentage !== null ? `${r.average_percentage}%` : 'No graded results',
      r.highest_percentage !== null ? `${r.highest_percentage}%` : '—',
      r.grade,
    ])
    downloadCsv('test-results-report', headers, rows)
    setOpen(false)
  }

  function exportHomework() {
    const headers = ['Student Name', 'Assigned', 'Completed', 'Pending', 'Completion %']
    const rows = data.homeworkRows.map((r) => [
      r.student_name,
      r.total_assigned,
      r.completed,
      r.pending,
      `${r.completion_rate}%`,
    ])
    downloadCsv('homework-report', headers, rows)
    setOpen(false)
  }

  function exportFees() {
    const headers = ['Student Name', 'Total Billed (INR)', 'Total Paid (INR)', 'Balance (INR)', 'Status']
    const rows = data.feeRows.map((r) => [r.student_name, r.total_billed, r.total_paid, r.balance, r.status])
    downloadCsv('fees-report', headers, rows)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="gap-1.5 text-xs font-semibold"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Export CSV</span>
        <ChevronDown className="h-3 w-3 text-gray-500" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg text-xs font-medium text-gray-700">
            <button
              onClick={exportStudents}
              className="flex w-full px-3.5 py-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left"
            >
              Export Students
            </button>
            <button
              onClick={exportAttendance}
              className="flex w-full px-3.5 py-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left"
            >
              Export Attendance
            </button>
            <button
              onClick={exportTests}
              className="flex w-full px-3.5 py-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left"
            >
              Export Test Results
            </button>
            <button
              onClick={exportHomework}
              className="flex w-full px-3.5 py-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left"
            >
              Export Homework
            </button>
            <button
              onClick={exportFees}
              className="flex w-full px-3.5 py-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left border-t border-gray-100"
            >
              Export Fees & Dues
            </button>
          </div>
        </>
      )}
    </div>
  )
}
