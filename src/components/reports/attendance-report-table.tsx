'use client'

import React from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { StudentAttendanceReportRow } from '@/types'

export function AttendanceReportTable({
  rows,
  onSelectStudent,
}: {
  rows: StudentAttendanceReportRow[]
  onSelectStudent: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Attendance Report</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Student attendance consistency. Students below 75% are flagged for review.
          </p>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400">No attendance data for this selection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold text-gray-600">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Batch</th>
                  <th className="px-4 py-3.5 text-center">Sessions</th>
                  <th className="px-4 py-3.5 text-center">Present</th>
                  <th className="px-4 py-3.5 text-center">Absent</th>
                  <th className="px-4 py-3.5 text-right">Attendance %</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.student_id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      <button
                        onClick={() => onSelectStudent(row.student_id)}
                        className="hover:text-indigo-600 hover:underline text-left cursor-pointer"
                      >
                        {row.student_name}
                      </button>
                      {row.class_name && (
                        <p className="text-[11px] text-gray-400 font-normal">{row.class_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{row.batch_name || '—'}</td>
                    <td className="px-4 py-3.5 text-center text-gray-700">{row.total_sessions}</td>
                    <td className="px-4 py-3.5 text-center text-green-700 font-medium">{row.present}</td>
                    <td className="px-4 py-3.5 text-center text-red-600 font-medium">{row.absent}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                      {row.percentage}%
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge
                        variant={
                          row.status === 'Excellent'
                            ? 'success'
                            : row.status === 'Good'
                            ? 'default'
                            : 'danger'
                        }
                      >
                        {row.status}
                      </Badge>
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
