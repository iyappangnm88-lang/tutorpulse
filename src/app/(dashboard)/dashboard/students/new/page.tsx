import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StudentForm } from '@/components/students/student-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Student — TutorPulse',
}

export default function NewStudentPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Students</span>
        </Link>
        <PageHeader
          title="Enroll New Student"
          description="Enter the student's personal and academic details."
        />
      </div>

      <StudentForm mode="create" />
    </div>
  )
}
