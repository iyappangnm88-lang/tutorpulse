import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentPermissionsClient } from '@/components/student/student-permissions-client'

export const metadata: Metadata = {
  title: 'Permissions & Privacy — Nuzigo Settings',
  description: 'Manage the device capabilities and permissions NUZIGO uses to support your learning and Focus experience.',
}

export const dynamic = 'force-dynamic'

export default async function StudentPermissionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <StudentPermissionsClient />
}
