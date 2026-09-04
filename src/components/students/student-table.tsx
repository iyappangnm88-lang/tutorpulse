'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, Edit2, Archive, Phone, Mail } from 'lucide-react'
import { StudentStatusBadge } from './student-status-badge'
import type { Student } from '@/types'

interface StudentTableProps {
  students: Student[]
  onArchive: (student: Student) => void
}

export function StudentTable({ students, onArchive }: StudentTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 font-medium text-gray-600">
          <tr>
            <th scope="col" className="px-5 py-3.5">Student Name</th>
            <th scope="col" className="px-4 py-3.5">Class / Standard</th>
            <th scope="col" className="px-4 py-3.5">Contact</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50/75 transition-colors">
              <td className="px-5 py-4">
                <Link
                  href={`/dashboard/students/${student.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {student.full_name}
                </Link>
                {student.school_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{student.school_name}</p>
                )}
              </td>
              <td className="px-4 py-4 text-gray-600">
                {student.class_name || '—'}
              </td>
              <td className="px-4 py-4">
                <div className="space-y-0.5 text-xs text-gray-600">
                  {student.phone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{student.phone}</span>
                    </div>
                  ) : null}
                  {student.email ? (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-[160px]">{student.email}</span>
                    </div>
                  ) : null}
                  {!student.phone && !student.email && <span>—</span>}
                </div>
              </td>
              <td className="px-4 py-4">
                <StudentStatusBadge status={student.status} />
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="View Details"
                    aria-label="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/dashboard/students/${student.id}/edit`}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit Student"
                    aria-label="Edit Student"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  {student.status !== 'archived' && (
                    <button
                      onClick={() => onArchive(student)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Archive Student"
                      aria-label="Archive Student"
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
