'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, Edit2, Archive, Phone, Mail, GraduationCap } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { StudentStatusBadge } from './student-status-badge'
import type { Student } from '@/types'

interface StudentCardProps {
  student: Student
  onArchive: (student: Student) => void
}

export function StudentCard({ student, onArchive }: StudentCardProps) {
  return (
    <Card className="hover:border-indigo-200 transition-colors">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/dashboard/students/${student.id}`}
              className="text-base font-semibold text-gray-900 hover:text-indigo-600"
            >
              {student.full_name}
            </Link>
            {student.class_name && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                <span>{student.class_name}</span>
                {student.school_name && <span>• {student.school_name}</span>}
              </div>
            )}
          </div>
          <StudentStatusBadge status={student.status} />
        </div>

        {(student.phone || student.email) && (
          <div className="space-y-1 text-xs text-gray-600 pt-1 border-t border-gray-100">
            {student.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <a href={`tel:${student.phone}`} className="hover:underline text-indigo-600">
                  {student.phone}
                </a>
              </div>
            )}
            {student.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <a href={`mailto:${student.email}`} className="hover:underline text-gray-700 truncate">
                  {student.email}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/students/${student.id}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 min-h-[36px]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </Link>
          <Link
            href={`/dashboard/students/${student.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 min-h-[36px]"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>
          {student.status !== 'archived' && (
            <button
              onClick={() => onArchive(student)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 min-h-[36px]"
              aria-label="Archive student"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
