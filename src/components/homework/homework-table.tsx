'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, Edit2 } from 'lucide-react'
import { HomeworkStatusBadge } from './homework-status-badge'
import { HomeworkProgressBar } from './homework-progress-bar'
import type { HomeworkWithDetails } from '@/types'

interface HomeworkTableProps {
  homeworkList: HomeworkWithDetails[]
}

export function HomeworkTable({ homeworkList }: HomeworkTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 font-medium text-gray-600">
          <tr>
            <th scope="col" className="px-5 py-3.5">Homework Title</th>
            <th scope="col" className="px-4 py-3.5">Batch</th>
            <th scope="col" className="px-4 py-3.5">Assigned</th>
            <th scope="col" className="px-4 py-3.5">Due Date</th>
            <th scope="col" className="px-5 py-3.5 min-w-[160px]">Completion</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {homeworkList.map((hw) => {
            const assignedDate = new Date(hw.assigned_date).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            })
            const dueDate = hw.due_date
              ? new Date(hw.due_date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'

            return (
              <tr key={hw.id} className="hover:bg-gray-50/75 transition-colors">
                <td className="px-5 py-4">
                  <Link
                    href={`/dashboard/homework/${hw.id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline line-clamp-1"
                  >
                    {hw.title}
                  </Link>
                  {hw.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{hw.description}</p>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/batches/${hw.batch_id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {hw.batch?.name}
                  </Link>
                </td>
                <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                  {assignedDate}
                </td>
                <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                  {dueDate}
                </td>
                <td className="px-5 py-4">
                  <HomeworkProgressBar
                    completed={hw.completed_count}
                    total={hw.total_assigned}
                    rate={hw.completion_rate}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <HomeworkStatusBadge status={hw.display_status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/dashboard/homework/${hw.id}`}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="View Student Submissions"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/homework/${hw.id}/edit`}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Edit Assignment"
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
