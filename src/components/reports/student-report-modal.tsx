'use client'

import React from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { TestGradeBadge } from '@/components/tests/test-grade-badge'
import { FeeStatusBadge } from '@/components/fees/fee-status-badge'
import { formatCurrency } from '@/lib/fee-utils'
import type { ConsolidatedStudentReport } from '@/types'

interface StudentReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: ConsolidatedStudentReport | null
  loading?: boolean
}

export function StudentReportModal({
  isOpen,
  onClose,
  report,
  loading = false,
}: StudentReportModalProps) {
  if (!report && !loading) return null

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Student Progress Report"
      description="Consolidated 360-degree academic and attendance report."
      confirmLabel="Print Report"
      onConfirm={handlePrint}
    >
      {loading || !report ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading student progress report...</div>
      ) : (
        <div className="space-y-4 print:space-y-2 text-xs">
          {/* Header Strip */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-bold text-gray-900 text-sm">{report.student.full_name}</p>
              <p className="text-gray-500 mt-0.5">
                {report.student.class_name ? `Class ${report.student.class_name}` : 'Class not specified'}{' '}
                {report.batch ? `• Batch: ${report.batch.name}` : ''}
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          {/* 4 Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-lg border border-gray-100 bg-white shadow-2xs">
              <span className="text-gray-500 block text-[11px]">Attendance</span>
              <span className="font-bold text-indigo-600 text-base mt-0.5 block">
                {report.attendance.percentage}%
              </span>
              <span className="text-[10px] text-gray-400">
                {report.attendance.present} of {report.attendance.total} sessions
              </span>
            </div>

            <div className="p-3 rounded-lg border border-gray-100 bg-white shadow-2xs">
              <span className="text-gray-500 block text-[11px]">Tests Avg</span>
              <span className="font-bold text-gray-900 text-base mt-0.5 block">
                {report.tests.average_pct !== null ? `${report.tests.average_pct}%` : '—'}
              </span>
              <div className="mt-0.5 flex justify-center">
                <TestGradeBadge grade={report.tests.grade} />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gray-100 bg-white shadow-2xs">
              <span className="text-gray-500 block text-[11px]">Homework</span>
              <span className="font-bold text-purple-700 text-base mt-0.5 block">
                {report.homework.completion_rate}%
              </span>
              <span className="text-[10px] text-gray-400">
                {report.homework.completed} of {report.homework.assigned} completed
              </span>
            </div>

            <div className="p-3 rounded-lg border border-gray-100 bg-white shadow-2xs">
              <span className="text-gray-500 block text-[11px]">Fee Balance</span>
              <span
                className={`font-bold text-base mt-0.5 block ${
                  report.fees.balance > 0 ? 'text-red-600' : 'text-green-700'
                }`}
              >
                {formatCurrency(report.fees.balance)}
              </span>
              <div className="mt-0.5 flex justify-center">
                <FeeStatusBadge status={report.fees.status} />
              </div>
            </div>
          </div>

          {/* Recent Test Results */}
          <div className="space-y-1.5">
            <p className="font-semibold text-gray-800 text-[11px] uppercase tracking-wider">
              Recent Test Scores
            </p>
            {report.tests.recent_marks.length === 0 ? (
              <p className="text-gray-400 text-xs italic">No test results recorded yet.</p>
            ) : (
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {report.tests.recent_marks.map((t, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-medium text-gray-900">{t.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(t.test_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {t.marks !== null ? `${t.marks} / ${t.max_marks}` : 'Ungraded'}
                      </span>
                      <TestGradeBadge grade={t.grade} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
