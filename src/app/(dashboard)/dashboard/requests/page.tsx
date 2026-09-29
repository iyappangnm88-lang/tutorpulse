import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTutorJoinRequests } from '@/lib/marketplace'
import { TutorRequestsClient } from '@/components/dashboard/tutor-requests-client'
import { PageGuide } from '@/components/help/page-guide'

export const metadata: Metadata = {
  title: 'Student Join Requests — Nuzilo',
  description: 'Manage and review prospective student enrollment requests from the Nuzilo Marketplace.',
}

export const dynamic = 'force-dynamic'

export default async function TutorRequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'tutor') {
    redirect('/login')
  }

  const requestsData = await getTutorJoinRequests(user.id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageGuide topicId="marketplace" defaultCollapsed={true} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Student Join Requests
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Review and approve batch enrollment requests from prospective students who discovered your public tutor profile.
        </p>
      </div>

      <TutorRequestsClient initialData={requestsData} tutorId={user.id} />
    </div>
  )
}
