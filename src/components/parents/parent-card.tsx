'use client'

import React from 'react'
import Link from 'next/link'
import { Phone, Mail, Eye, Edit2, GraduationCap } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import type { ParentWithStudents } from '@/types'

interface ParentCardProps {
  parent: ParentWithStudents
}

export function ParentCard({ parent }: ParentCardProps) {
  return (
    <Card className="hover:border-indigo-200 transition-colors flex flex-col justify-between">
      <CardBody className="space-y-3">
        <div>
          <Link
            href={`/dashboard/parents/${parent.id}`}
            className="text-base font-bold text-gray-900 hover:text-indigo-600 line-clamp-1"
          >
            {parent.full_name}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
            <span>
              {parent.student_count === 0
                ? 'No students linked'
                : `${parent.student_count} ${parent.student_count === 1 ? 'Student' : 'Students'}`}
            </span>
          </div>
        </div>

        {parent.primary_student_names.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {parent.primary_student_names.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {(parent.phone || parent.email) && (
          <div className="space-y-1 text-xs text-gray-600 pt-2 border-t border-gray-100">
            {parent.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <a href={`tel:${parent.phone}`} className="hover:underline text-indigo-600 font-medium">
                  {parent.phone}
                </a>
              </div>
            )}
            {parent.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <a href={`mailto:${parent.email}`} className="hover:underline text-gray-700 truncate">
                  {parent.email}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/parents/${parent.id}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 min-h-[36px]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Profile</span>
          </Link>
          <Link
            href={`/dashboard/parents/${parent.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 min-h-[36px]"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
