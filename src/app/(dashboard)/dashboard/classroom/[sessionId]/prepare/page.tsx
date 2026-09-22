import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Video,
  ArrowLeft,
  Users,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Tv,
  Mic,
  Settings2,
} from 'lucide-react'
import { verifySessionAccess } from '@/lib/classroom/auth'
import { getBatchEnrolledStudents } from '@/lib/batches'
import { getBatchHomework } from '@/lib/homework'
import { getBatchTests } from '@/lib/tests'
import { formatTimeRange } from '@/lib/scheduling'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SessionStatusBadge } from '@/components/calendar/session-status-badge'
import type { Metadata } from 'next'

interface PrepareClassPageProps {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: PrepareClassPageProps): Promise<Metadata> {
  const { sessionId } = await params
  return {
    title: `Prepare Live Class — TutorPulse`,
  }
}

export const dynamic = 'force-dynamic'

export default async function PrepareClassPage({ params }: PrepareClassPageProps) {
  const { sessionId } = await params

  // 1. Verify user authentication & tutor ownership
  const authResult = await verifySessionAccess(sessionId)

  if (!authResult.authorized || !authResult.session) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-base font-bold text-white">Classroom Access Denied</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            {authResult.error || 'You do not have permission to prepare or host this class.'}
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

  const session = authResult.session

  // Cross-route guard: offline classes use /dashboard/class/[sessionId]
  if (session.class_mode === 'offline') {
    redirect(`/dashboard/class/${sessionId}`)
  }

  // Fetch batch context: students, homework, tests
  const [enrolledRes, homeworkRes, testsRes] = await Promise.all([
    getBatchEnrolledStudents(session.batch_id).catch(() => ({ data: [], error: null })),
    getBatchHomework(session.batch_id).catch(() => ({ data: [], error: null })),
    getBatchTests(session.batch_id).catch(() => ({ data: [], error: null })),
  ])

  const enrolledStudents = enrolledRes.data || []
  const recentHomework = (homeworkRes.data || []).slice(0, 2)
  const recentTests = (testsRes.data || []).slice(0, 2)

  const isLive = session.status === 'in_progress'

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <Link
          href={`/dashboard/batches/${session.batch_id}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          View Batch Details →
        </Link>
      </div>

      {/* Hero Preparation Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase bg-indigo-400 text-indigo-950 shadow-xs">
                <Video className="h-3 w-3" />
                Live Online Staging
              </span>
              <SessionStatusBadge status={session.status} className="text-xs px-2 py-0.5" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Class Preparation: {session.batch.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-white/80 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 opacity-70" />
                {new Date(session.session_date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 opacity-70" />
                {formatTimeRange(session.start_time, session.end_time)}
              </span>
              <span>•</span>
              <span className="capitalize">{session.batch.subject || 'General'}</span>
              {session.batch.class_name && <span>• Class {session.batch.class_name}</span>}
            </div>

            {session.notes && (
              <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/10 text-xs text-white/90">
                <span className="font-bold text-white/70 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Session Topic / Agenda:
                </span>
                {session.notes}
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <Link
              href={`/dashboard/classroom/${session.id}`}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-extrabold text-indigo-950 bg-white hover:bg-indigo-50 shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Video className="h-5 w-5 text-indigo-600" />
              <span>{isLive ? 'Enter Live Classroom' : 'Launch Classroom Now'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-[11px] text-white/60 text-center sm:text-right">
              Opens WebRTC video, digital whiteboard & live chat
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Pre-Flight Checklist & Students Roster */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Cols: Pre-flight checklist & context */}
        <div className="md:col-span-2 space-y-6">
          {/* Pre-Class Preparation Checklist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">Tutor Pre-Flight Checklist</h2>
              </div>
              <Badge variant="info">Ready to teach</Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Audio & Mic</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Ensure your headset or microphone is selected and permissions granted.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Camera & Lighting</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Position camera at eye level with adequate front lighting.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Tv className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Whiteboard & Tabs</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Interactive multi-page board is loaded inside the classroom automatically.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Waiting Room</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Students wait until you admit them or class begins.
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Batch Context (Homework & Tests) */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Recent Homework */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-gray-900">Batch Homework</h3>
                </div>
                <Link
                  href={`/dashboard/homework/new?batchId=${session.batch_id}`}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Assign
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {recentHomework.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No recent homework assigned for this batch.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentHomework.map((hw) => (
                      <Link
                        key={hw.id}
                        href={`/dashboard/homework/${hw.id}`}
                        className="p-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors group block"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 truncate">
                            {hw.title}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Due {hw.due_date ? new Date(hw.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'No due date'}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {hw.completed_count}/{hw.total_assigned} done
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Tests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-gray-900">Batch Tests</h3>
                </div>
                <Link
                  href={`/dashboard/tests/new?batchId=${session.batch_id}`}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Create
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {recentTests.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No upcoming or recent tests for this batch.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentTests.map((test) => (
                      <Link
                        key={test.id}
                        href={`/dashboard/tests/${test.id}`}
                        className="p-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors group block"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 truncate">
                            {test.title}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {test.test_date ? new Date(test.test_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Date TBD'} • {test.max_marks} marks
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {test.graded_count}/{test.total_students} graded
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Right Col: Expected Students Roster */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Expected Students</h3>
              </div>
              <Badge variant="default">{enrolledStudents.length} Enrolled</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {enrolledStudents.length === 0 ? (
                <div className="p-5 text-center text-xs text-gray-400">
                  No students enrolled in this batch yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {enrolledStudents.map(({ student }) => (
                    <div
                      key={student.id}
                      className="p-3 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {student.full_name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {student.class_name ? `Class ${student.class_name}` : student.email || 'Enrolled learner'}
                        </p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Enrolled" />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
