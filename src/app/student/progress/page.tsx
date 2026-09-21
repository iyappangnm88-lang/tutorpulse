import React from 'react'
import { redirect } from 'next/navigation'
import { TrendingUp, Award, CalendarCheck, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentDashboardData } from '@/lib/student-portal'

export const dynamic = 'force-dynamic'

export default async function StudentProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getStudentDashboardData(user.id)
  const { stats, connectedTutors, testList, homeworkList } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Learning Progress</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Track your engagement, assessment consistency, and study milestones
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Live Classes</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeClassesCount} Active</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
            Across {stats.totalTutors} connected workspaces
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Assignments</p>
              <p className="text-xl font-bold text-gray-900">{homeworkList.length} Tracked</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
            {stats.pendingHomeworkCount} pending submission
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Tests & Quizzes</p>
              <p className="text-xl font-bold text-gray-900">{stats.completedTestsCount} Recorded</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
            Performance logged by instructors
          </p>
        </div>
      </div>

      {/* Progress Motivation Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-gray-900">Study Consistency</h2>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
          Consistency is key to mastering concepts. Make sure to attend your live interactive whiteboard sessions, submit assignments before deadlines, and review feedback from your tutors.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-gray-900">Active Feedback Loop</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Your homework and test marks are evaluated directly by your tutors with personalized guidance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-gray-900">Cross-Platform Accessible</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Join classes seamlessly on mobile, tablet, or desktop with low-latency interactive audio and whiteboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
