import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { StudentListClient } from '@/components/students/student-list-client'
import { getStudents } from '@/lib/students'
import { getBatches } from '@/lib/batches'
import { getActiveWorkspace } from '@/lib/workspace'
import { createClient } from '@/lib/supabase/server'
import { PageGuide } from '@/components/help/page-guide'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Students — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const { activeWorkspace } = await getActiveWorkspace()
  const wsId = activeWorkspace?.id

  const [studentsRes, batchesRes] = await Promise.all([
    getStudents(wsId).catch(() => ({ data: [], error: null })),
    getBatches(wsId).catch(() => ({ data: [], error: null })),
  ])

  const students = studentsRes.data || []
  const batches = batchesRes.data || []

  // Fetch batch memberships to map student_id -> batches
  const studentBatchesMap: Record<string, { id: string; name: string }[]> = {}
  try {
    const supabase = await createClient()
    const { data: memberships } = await supabase
      .from('batch_students')
      .select('student_id, batch_id, batch:batches(id, name)')

    if (memberships) {
      for (const m of memberships) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = m.batch as any
        if (b && m.student_id) {
          if (!studentBatchesMap[m.student_id]) {
            studentBatchesMap[m.student_id] = []
          }
          studentBatchesMap[m.student_id].push({ id: b.id, name: b.name })
        }
      }
    }
  } catch {
    // Ignore error
  }

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

      {studentsRes.error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to Supabase database ({studentsRes.error}).
        </div>
      )}

      <StudentListClient
        initialStudents={students}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        studentBatchesMap={studentBatchesMap}
      />
    </div>
  )
}
