'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, Edit2, Phone, Mail } from 'lucide-react'
import type { ParentWithStudents } from '@/types'

interface ParentTableProps {
  parents: ParentWithStudents[]
}

export function ParentTable({ parents }: ParentTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 font-medium text-gray-600">
          <tr>
            <th scope="col" className="px-5 py-3.5">Parent / Guardian</th>
            <th scope="col" className="px-4 py-3.5">Contact Information</th>
            <th scope="col" className="px-4 py-3.5">Linked Students</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {parents.map((parent) => (
            <tr key={parent.id} className="hover:bg-gray-50/75 transition-colors">
              <td className="px-5 py-4">
                <Link
                  href={`/dashboard/parents/${parent.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {parent.full_name}
                </Link>
                {parent.address && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{parent.address}</p>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="space-y-0.5 text-xs text-gray-600">
                  {parent.phone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <a href={`tel:${parent.phone}`} className="text-indigo-600 hover:underline font-medium">
                        {parent.phone}
                      </a>
                    </div>
                  ) : null}
                  {parent.email ? (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-[160px]">{parent.email}</span>
                    </div>
                  ) : null}
                  {!parent.phone && !parent.email && <span>—</span>}
                </div>
              </td>
              <td className="px-4 py-4">
                {parent.student_count === 0 ? (
                  <span className="text-xs text-gray-400">None linked</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {parent.primary_student_names.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/parents/${parent.id}`}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="View Profile"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/dashboard/parents/${parent.id}/edit`}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit Parent"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
