'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, Edit2 } from 'lucide-react'
import { TestStatusBadge } from './test-status-badge'
import { TestGradeBadge } from './test-grade-badge'
import { calculateGrade } from '@/lib/test-utils'
import type { TestWithDetails } from '@/types'

interface TestTableProps {
  tests: TestWithDetails[]
}

export function TestTable({ tests }: TestTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 font-medium text-gray-600">
          <tr>
            <th scope="col" className="px-5 py-3.5">Test Title</th>
            <th scope="col" className="px-4 py-3.5">Batch</th>
            <th scope="col" className="px-4 py-3.5">Test Date</th>
            <th scope="col" className="px-4 py-3.5">Max Marks</th>
            <th scope="col" className="px-4 py-3.5">Graded</th>
            <th scope="col" className="px-4 py-3.5">Class Average</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {tests.map((test) => {
            const dateStr = new Date(test.test_date).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <tr key={test.id} className="hover:bg-gray-50/75 transition-colors">
                <td className="px-5 py-4">
                  <Link
                    href={`/dashboard/tests/${test.id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline line-clamp-1"
                  >
                    {test.title}
                  </Link>
                  {test.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{test.description}</p>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/batches/${test.batch_id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {test.batch?.name}
                  </Link>
                </td>
                <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                  {dateStr}
                </td>
                <td className="px-4 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                  {test.max_marks}
                </td>
                <td className="px-4 py-4 text-xs text-gray-600 whitespace-nowrap">
                  {test.graded_count} / {test.total_students}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {test.average_percentage !== null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{test.average_percentage}%</span>
                      <TestGradeBadge grade={calculateGrade(test.average_percentage)} />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Not Graded</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <TestStatusBadge status={test.display_status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/dashboard/tests/${test.id}`}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Enter Student Marks"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/tests/${test.id}/edit`}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Edit Test Details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
