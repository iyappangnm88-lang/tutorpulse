import React from 'react'
import Link from 'next/link'
import {
  Video,
  Play,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTodaySessions, getUpcomingSessions } from '@/lib/class-sessions'
import { getBatches } from '@/lib/batches'
import { formatTimeRange } from '@/lib/scheduling'
import { SessionStatusBadge } from '@/components/calendar/session-status-badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Online Classroom — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function ClassroomHubPage() {
  const [todayRes, upcomingRes, batchesRes] = await Promise.all([
    getTodaySessions().catch(() => ({ data: [], error: null })),
    getUpcomingSessions(10).catch(() => ({ data: [], error: null })),
    getBatches().catch(() => ({ data: [], error: null })),
  ])

  const allTodaySessions = todayRes.data || []
  const allUpcomingSessions = upcomingRes.data || []
  const batches = batchesRes.data || []

  // Filter for online and hybrid sessions
  const onlineTodaySessions = allTodaySessions.filter(
    (s) => s.class_mode === 'online' || s.class_mode === 'hybrid'
  )
  const onlineUpcomingSessions = allUpcomingSessions.filter(
    (s) => s.class_mode === 'online' || s.class_mode === 'hybrid'
  )
  const onlineBatches = batches.filter(
    (b) => b.class_mode === 'online' || b.class_mode === 'hybrid'
  )

  const activeLiveSession = onlineTodaySessions.find((s) => s.status === 'in_progress')

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Online Classroom Hub
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage, schedule, and launch live tuition classes with audio, video, and screen sharing.
              </p>
            </div>
          </div>
        </div>

        {/* Video Service Status Badge */}
        <div className="shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WebRTC Classroom Active (Free & Self-Hosted)</span>
          </div>
        </div>
      </div>

      {/* 3. Active Live Class Banner (if any session is currently live) */}
      {activeLiveSession && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Live Now
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  Active Online Class
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {activeLiveSession.batch.name}
              </h2>
              <p className="text-xs text-emerald-100 flex items-center gap-2">
                <span>{activeLiveSession.batch.subject || 'Tuition'}</span>
                <span>•</span>
                <span>{formatTimeRange(activeLiveSession.start_time, activeLiveSession.end_time)}</span>
                <span>•</span>
                <span>{activeLiveSession.student_count ?? 0} Enrolled Students</span>
              </p>
            </div>

            <Link
              href={`/dashboard/classroom/${activeLiveSession.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white text-emerald-950 hover:bg-emerald-50 shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
            >
              <Video className="h-4 w-4 text-emerald-700" />
              <span>Enter Live Classroom</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Today's Online Classes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>Today&apos;s Online Classes</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Online and hybrid sessions scheduled for today
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {onlineTodaySessions.length} {onlineTodaySessions.length === 1 ? 'Class' : 'Classes'}
          </span>
        </CardHeader>

        <CardBody className="p-0">
          {onlineTodaySessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-2">
              <Video className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700">No online classes scheduled for today.</p>
              <p className="text-gray-400 max-w-sm mx-auto">
                Check your upcoming schedule below, or launch an instant class from your online batches.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {onlineTodaySessions.map((session) => {
                const isLive = session.status === 'in_progress'
                const isCompleted = session.status === 'completed'

                return (
                  <div
                    key={session.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold text-sm ${
                          isLive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {isLive ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 truncate">
                            {session.batch.name}
                          </h3>
                          <SessionStatusBadge status={session.status} />
                          <Badge variant="default" className="capitalize text-[10px]">
                            {session.class_mode}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                          <span>•</span>
                          <span>{session.batch.subject || 'Tuition'}</span>
                          <span>•</span>
                          <span>{session.student_count ?? 0} Students</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {!isCompleted ? (
                        <Link
                          href={`/dashboard/classroom/${session.id}`}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isLive
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                          }`}
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>{isLive ? 'Enter Live Classroom' : 'Enter Classroom'}</span>
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 border border-gray-200">
                          Class Completed
                        </span>
                      )}

                      <Link
                        href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                        className="text-xs font-semibold text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Attendance
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 5. Quick Launch / Online Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Your Online & Hybrid Batches</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Cohorts configured for online video classes
              </p>
            </CardHeader>

            <CardBody className="p-4 sm:p-5">
              {onlineBatches.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 space-y-3">
                  <Layers className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="font-semibold text-gray-700">No batches currently set to Online or Hybrid mode.</p>
                  <p className="text-gray-400 max-w-md mx-auto">
                    To host online tuition classes, edit any of your batches and set Class Mode to <strong>Online</strong> or <strong>Hybrid</strong>.
                  </p>
                  <Link
                    href="/dashboard/batches"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Manage Batches →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onlineBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-xs text-gray-900 truncate">
                            {batch.name}
                          </h3>
                          <Badge variant="default" className="text-[10px] capitalize">
                            {batch.class_mode}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {batch.subject || 'General'} • {formatTimeRange(batch.start_time, batch.end_time)}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between">
                        <Link
                          href={`/dashboard/batches/${batch.id}`}
                          className="text-[11px] font-semibold text-gray-600 hover:text-indigo-600"
                        >
                          Batch Details
                        </Link>
                        <Link
                          href="/dashboard/calendar"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          <span>Calendar</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* 6. Upcoming Classes Sidebar */}
        <div>
          <Card className="h-full">
            <CardHeader className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>Upcoming Online Classes</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Next 14 days schedule</p>
            </CardHeader>

            <CardBody className="p-4 space-y-3">
              {onlineUpcomingSessions.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  No upcoming online classes scheduled in the next 14 days.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {onlineUpcomingSessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 truncate">
                          {session.batch.name}
                        </span>
                        <SessionStatusBadge status={session.status} className="text-[9px] px-1.5 py-0" />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {session.session_date} • {formatTimeRange(session.start_time, session.end_time)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <Link
                  href="/dashboard/calendar"
                  className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1"
                >
                  <span>Open Full Calendar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
