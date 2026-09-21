import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { verifySessionAccess } from '@/lib/classroom/auth'
import { ClassroomView } from '@/components/classroom/classroom-view'
import type { Metadata } from 'next'

interface StudentClassroomPageProps {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: StudentClassroomPageProps): Promise<Metadata> {
  const { sessionId } = await params
  return {
    title: `Live Class — Student Classroom`,
  }
}

export const dynamic = 'force-dynamic'

export default async function StudentClassroomPage({ params }: StudentClassroomPageProps) {
  const { sessionId } = await params

  // 1. Verify user authentication & connection/enrollment link
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
            {authResult.error || 'You are not enrolled in or connected to this class session.'}
          </p>
          <div className="pt-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Student Portal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If a tutor accesses this route, redirect them to the host dashboard classroom
  if (authResult.role === 'host') {
    redirect(`/dashboard/classroom/${sessionId}`)
  }

  return (
    <ClassroomView
      session={authResult.session}
      initialRole="participant"
      currentUserName={authResult.user.name}
      currentUserId={authResult.user.id}
      portalType="student"
    />
  )
}
