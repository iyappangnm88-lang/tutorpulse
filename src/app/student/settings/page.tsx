import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentProfile } from '@/lib/student-portal'
import { StudentSettingsClient } from '@/components/student/student-settings-client'

export const dynamic = 'force-dynamic'

export default async function StudentSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [studentProfile, userProfile] = await Promise.all([
    getStudentProfile(user.id),
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
  ])

  const initialData = {
    fullName: studentProfile?.full_name || userProfile.data?.full_name || '',
    email: userProfile.data?.email || user.email || '',
    gradeLevel: studentProfile?.grade_level || null,
    schoolName: studentProfile?.school_name || null,
    interests: studentProfile?.interests || [],
  }

  return <StudentSettingsClient initialData={initialData} />
}
