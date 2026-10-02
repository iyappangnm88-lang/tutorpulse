import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getMyStudyGroups, getDiscoverStudyGroups } from '@/lib/study-groups'
import { StudyGroupsHomeClient } from '@/components/study-groups/study-groups-home-client'

export const metadata: Metadata = {
  title: 'Study Groups — Nuzigo',
}

export const dynamic = 'force-dynamic'

export default async function StudyGroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [myGroups, discoverGroups] = await Promise.all([
    getMyStudyGroups(user.id),
    getDiscoverStudyGroups(user.id, 'popular'),
  ])

  return (
    <StudyGroupsHomeClient
      myGroups={myGroups}
      discoverGroups={discoverGroups}
    />
  )
}
