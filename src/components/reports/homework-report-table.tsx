'use client'

import React from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import type { StudentHomeworkReportRow } from '@/types'

export function HomeworkReportTable({
  rows,
  onSelectStudent,
}: {
  rows: StudentHomeworkReportRow[]
  onSelectStudent: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Homework Analytics</h2>
        <p className="text-xs text-gray-500 mt-0.5">Homework completion rates per student.</p>
      </CardHeader>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400">No homework data for this selection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold text-gray-600">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-4 py-3.5 text-center">Assigned</th>
                  <th className="px-4 py-3.5 text-center">Completed</th>
                  <th className="px-4 py-3.5 text-center">Pending</th>
                  <th className="px-5 py-3.5 text-right">Completion Rate</th>
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
                    <td className="px-4 py-3.5 text-center text-gray-700">{row.total_assigned}</td>
                    <td className="px-4 py-3.5 text-center text-green-700 font-medium">{row.completed}</td>
                    <td className="px-4 py-3.5 text-center text-yellow-600 font-medium">{row.pending}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-purple-700">
                      {row.completion_rate}%
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
