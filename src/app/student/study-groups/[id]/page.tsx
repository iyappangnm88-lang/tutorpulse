import React from 'react'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getStudyGroupDetails } from '@/lib/study-groups'
import { StudyGroupClient } from '@/components/study-groups/study-group-client'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: group } = await supabase
    .from('study_groups')
    .select('name, subject')
    .eq('id', id)
    .maybeSingle()

  if (!group) {
    return { title: 'Study Group — Nuzigo' }
  }

  return {
    title: `${group.name} (${group.subject}) — Study Group`,
  }
}

export default async function StudyGroupDetailsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const details = await getStudyGroupDetails(id, user.id)

  if (!details.group) {
    notFound()
  }

  return (
    <StudyGroupClient
      group={details.group}
      members={details.members}
      rankedMembers={details.rankedMembers}
      tiers={details.tiers}
      myMemberRecord={details.myMemberRecord}
      myRole={details.myRole}
      myRequestStatus={details.myRequestStatus}
      liveUsers={details.liveUsers}
      messages={details.messages}
      messageCountToday={details.messageCountToday}
      messageDailyLimit={details.messageDailyLimit}
      joinRequests={details.joinRequests}
      currentUserId={user.id}
    />
  )
}
