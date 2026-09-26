import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicTutorBySlug } from '@/lib/marketplace'
import { PublicTutorProfileClient } from '@/components/marketplace/public-tutor-profile-client'

interface ProfilePageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    offering?: string
  }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const tutorData = await getPublicTutorBySlug(slug, true)

  if (!tutorData) {
    return {
      title: 'Tutor Not Found — Nuzilo',
    }
  }

  const { profile } = tutorData
  return {
    title: `${profile.fullName} | Tutor Profile — Nuzilo`,
    description:
      profile.headline ||
      `Learn with ${profile.fullName}. Explore active coaching batches, schedule, and request to enroll on TutorPulse.`,
  }
}

export const dynamic = 'force-dynamic'

export default async function PublicTutorProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { slug } = await params
  const { offering } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: 'tutor' | 'student' | 'parent' | null = null
  let existingStudentRequests: Array<{ batchId: string; status: string }> = []

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = (profile?.role as any) || null

    if (userRole === 'student') {
      const { data: requests } = await supabase
        .from('join_requests')
        .select('batch_id, status')
        .eq('student_user_id', user.id)

      if (requests) {
        existingStudentRequests = requests.map((r) => ({
          batchId: r.batch_id,
          status: r.status,
        }))
      }
    }
  }

  // Allow preview if viewing own profile as tutor
  const allowPrivate = user ? true : false
  const tutorData = await getPublicTutorBySlug(slug, allowPrivate)

  if (!tutorData) {
    notFound()
  }

  const isOwner = user?.id === tutorData.profile.id

  return (
    <PublicTutorProfileClient
      tutorDetail={tutorData}
      currentUser={
        user
          ? {
              id: user.id,
              email: user.email || '',
              role: userRole,
            }
          : null
      }
      isOwner={isOwner}
      existingRequests={existingStudentRequests}
      selectedOfferingId={offering || null}
    />
  )
}
