import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { verifySessionAccess } from '@/lib/classroom/auth'
import { ClassroomView } from '@/components/classroom/classroom-view'
import type { Metadata } from 'next'

interface ClassroomPageProps {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: ClassroomPageProps): Promise<Metadata> {
  const { sessionId } = await params
  return {
    title: `Online Classroom — TutorPulse`,
  }
}

export const dynamic = 'force-dynamic'

export default async function TutorClassroomPage({ params }: ClassroomPageProps) {
  const { sessionId } = await params

  // 1. Verify user authentication & tutor ownership (IDOR protection)
  const authResult = await verifySessionAccess(sessionId)

  if (!authResult.authorized || !authResult.session || !authResult.user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-base font-bold text-white">Classroom Access Denied</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            {authResult.error || 'You do not have permission to host or enter this online classroom session.'}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Cross-route guard: If this is an offline session, redirect to the offline physical class view
  if (authResult.session.class_mode === 'offline') {
    redirect(`/dashboard/class/${sessionId}`)
  }

  // If a parent tries to enter the tutor dashboard classroom route, redirect to parent route
  if (authResult.role === 'participant') {
    redirect(`/parent/classroom/${sessionId}`)
  }

  return (
    <ClassroomView
      session={authResult.session}
      initialRole="host"
      currentUserName={authResult.user.name}
      currentUserId={authResult.user.id}
      portalType="tutor"
    />
  )
}
