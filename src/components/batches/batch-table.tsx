'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, Edit2, Archive, Users, ClipboardCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BatchScheduleBadge } from './batch-schedule-badge'
import type { BatchWithCount } from '@/types'

interface BatchTableProps {
  batches: BatchWithCount[]
  onArchive: (batch: BatchWithCount) => void
}

export function BatchTable({ batches, onArchive }: BatchTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 font-medium text-gray-600">
          <tr>
            <th scope="col" className="px-5 py-3.5">Batch Name & Subject</th>
            <th scope="col" className="px-4 py-3.5">Class / Standard</th>
            <th scope="col" className="px-4 py-3.5">Schedule & Mode</th>
            <th scope="col" className="px-4 py-3.5 text-center">Students</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-gray-50/75 transition-colors">
              <td className="px-5 py-4">
                <Link
                  href={`/dashboard/batches/${batch.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {batch.name}
                </Link>
                {batch.subject && (
                  <p className="text-xs text-gray-500 mt-0.5">{batch.subject}</p>
                )}
              </td>
              <td className="px-4 py-4 text-gray-600">
                {batch.class_name || '—'}
              </td>
              <td className="px-4 py-4 text-gray-600 text-xs">
                <BatchScheduleBadge batch={batch} showLocation={false} />
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  <Users className="h-3 w-3" />
                  {batch.student_count}
                </span>
              </td>
              <td className="px-4 py-4">
                <Badge variant={batch.status === 'active' ? 'success' : 'default'}>
                  {batch.status === 'active' ? 'Active' : 'Archived'}
                </Badge>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/attendance?batch=${batch.id}`}
                    className="p-1.5 text-green-700 hover:bg-green-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center font-medium text-xs gap-1"
                    title="Mark Attendance"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Attendance</span>
                  </Link>
                  <Link
                    href={`/dashboard/batches/${batch.id}`}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="View Batch Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/dashboard/batches/${batch.id}/edit`}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit Batch"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  {batch.status !== 'archived' && (
                    <button
                      onClick={() => onArchive(batch)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Archive Batch"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
