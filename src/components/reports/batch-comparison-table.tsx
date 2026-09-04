'use client'

import React from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/lib/fee-utils'
import type { BatchPerformanceReportRow } from '@/types'

export function BatchComparisonTable({ rows }: { rows: BatchPerformanceReportRow[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Batch Comparison Matrix</h2>
        <p className="text-xs text-gray-500 mt-0.5">Compare attendance, academics, and dues across active batches.</p>
      </CardHeader>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400">No batches available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold text-gray-600">
                <tr>
                  <th className="px-5 py-3.5">Batch Name</th>
                  <th className="px-4 py-3.5 text-center">Students</th>
                  <th className="px-4 py-3.5 text-right">Attendance</th>
                  <th className="px-4 py-3.5 text-right">Test Avg</th>
                  <th className="px-4 py-3.5 text-right">Homework %</th>
                  <th className="px-5 py-3.5 text-right">Outstanding Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((b) => (
                  <tr key={b.batch_id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {b.batch_name}
                      {b.subject && <span className="text-gray-400 font-normal"> ({b.subject})</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-700">{b.student_count}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{b.attendance_pct}%</td>
                    <td className="px-4 py-3.5 text-right text-gray-900">
                      {b.test_avg_pct !== null ? `${b.test_avg_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-purple-700">
                      {b.homework_completion_rate}%
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-red-600">
                      {formatCurrency(b.outstanding_fees)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
