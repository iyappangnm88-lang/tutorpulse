import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentTestsDetailed } from '@/lib/student-portal'
import { StudentTestsClient } from '@/components/student/student-tests-client'

export const dynamic = 'force-dynamic'

export default async function StudentTestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const testsList = await getStudentTestsDetailed(user.id)

  return <StudentTestsClient initialTests={testsList} />
}

