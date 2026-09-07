import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { verifySessionAccess } from '@/lib/classroom/auth'
import { createClient } from '@/lib/supabase/server'
import { ParentOfflineClassView } from '@/components/class/parent-offline-class-view'
import type { Metadata } from 'next'
import type { Attendance } from '@/types'

interface ParentOfflineClassPageProps {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: ParentOfflineClassPageProps): Promise<Metadata> {
  const { sessionId } = await params
  return {
    title: `In-Person Class Details — Parent Portal`,
  }
}

export const dynamic = 'force-dynamic'

export default async function ParentOfflineClassPage({ params }: ParentOfflineClassPageProps) {
  const { sessionId } = await params

  // 1. Verify user authentication & parent-child enrollment link
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
            {authResult.error || 'Your linked student is not enrolled in this class session.'}
          </p>
          <div className="pt-2">
            <Link
              href="/parent"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-black text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Parent Portal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Cross-route guard: If this session is ONLINE, redirect to the parent online classroom
  if (authResult.session.class_mode === 'online') {
    redirect(`/parent/classroom/${sessionId}`)
  }

  // If a tutor accesses this route, redirect them to the host dashboard offline class view
  if (authResult.role === 'host') {
    redirect(`/dashboard/class/${sessionId}`)
  }

  // Fetch linked student's attendance for this session
  let attendanceRecord: Attendance | null = null
  if (authResult.studentId) {
    const supabase = await createClient()
    const { data: attData } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', authResult.studentId)
      .or(`session_id.eq.${sessionId},and(batch_id.eq.${authResult.session.batch_id},attendance_date.eq.${authResult.session.session_date})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (attData) {
      attendanceRecord = attData as Attendance
    }
  }

  return (
    <ParentOfflineClassView
      session={authResult.session}
      studentName={authResult.user.name}
      attendance={attendanceRecord}
    />
  )
}
