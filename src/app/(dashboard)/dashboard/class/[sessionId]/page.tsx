import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { verifySessionAccess } from '@/lib/classroom/auth'
import { getBatchEnrolledStudents } from '@/lib/batches'
import { getSessionAttendance } from '@/lib/attendance'
import { OfflineClassView } from '@/components/class/offline-class-view'
import type { Metadata } from 'next'

interface OfflineClassPageProps {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: OfflineClassPageProps): Promise<Metadata> {
  const { sessionId } = await params
  return {
    title: `Physical Class Session — Nuzilo`,
  }
}

export const dynamic = 'force-dynamic'

export default async function TutorOfflineClassPage({ params }: OfflineClassPageProps) {
  const { sessionId } = await params

  // 1. Verify user authentication & tutor ownership (IDOR protection)
  const authResult = await verifySessionAccess(sessionId)

  if (!authResult.authorized || !authResult.session || !authResult.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Class Access Denied</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            {authResult.error || 'You do not have permission to view or manage this class session.'}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-black text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Cross-route guard: If this session is ONLINE, redirect to the WebRTC classroom
  if (authResult.session.class_mode === 'online') {
    redirect(`/dashboard/classroom/${sessionId}`)
  }

  // If an enrolled parent accesses this tutor dashboard route, redirect them to parent route
  if (authResult.role === 'participant') {
    redirect(`/parent/class/${sessionId}`)
  }

  // 2. Fetch enrolled students and existing attendance for this physical class
  const [studentsRes, attendanceRes] = await Promise.all([
    getBatchEnrolledStudents(authResult.session.batch_id),
    getSessionAttendance(
      authResult.session.id,
      authResult.session.batch_id,
      authResult.session.session_date
    ),
  ])

  return (
    <OfflineClassView
      session={authResult.session}
      enrolledStudents={studentsRes.data || []}
      existingAttendance={attendanceRes.data || []}
    />
  )
}
