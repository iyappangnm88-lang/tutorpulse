import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StudentForm } from '@/components/students/student-form'
import { getStudentById } from '@/lib/students'
import type { Metadata } from 'next'

interface EditStudentPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: EditStudentPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: student } = await getStudentById(id)
  return {
    title: student ? `Edit ${student.full_name} — TutorPulse` : 'Edit Student — TutorPulse',
  }
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params
  const { data: student, error } = await getStudentById(id)

  if (error || !student) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/dashboard/students/${student.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Student Details</span>
        </Link>
        <PageHeader
          title={`Edit ${student.full_name}`}
          description="Update student details, contact info, or enrollment status."
        />
      </div>

      <StudentForm mode="edit" initialData={student} />
    </div>
  )
}
