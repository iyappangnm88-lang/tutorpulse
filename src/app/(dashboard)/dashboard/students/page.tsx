import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { StudentListClient } from '@/components/students/student-list-client'
import { getStudents } from '@/lib/students'
import { PageGuide } from '@/components/help/page-guide'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Students — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const { data: students, error } = await getStudents()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageGuide topicId="students" defaultCollapsed={Boolean(students && students.length > 0)} />

      <PageHeader
        title="Students"
        description="Manage your enrolled students, contact info, and academic records."
      >
        <Link href="/dashboard/students/new">
          <Button size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to Supabase database ({error}). If you have not executed the SQL migration in Supabase yet, please run it in the SQL Editor.
        </div>
      )}

      <StudentListClient initialStudents={students} />
    </div>
  )
}
