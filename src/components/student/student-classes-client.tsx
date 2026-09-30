'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Video,
  MapPin,
  Calendar,
  Clock,
  Play,
  GraduationCap,
  Sparkles,
  Info,
  ChevronRight,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatFriendlyDate } from '@/lib/calendar-utils'
import { formatTimeRange } from '@/lib/scheduling'
import type { ClassSession } from '@/types'
import type { StudentEnrolledBatch } from '@/lib/student-portal'

type ExtendedSession = ClassSession & {
  batch_name?: string
  tutor_name?: string
}

interface StudentClassesClientProps {
  liveSessions: ExtendedSession[]
  upcomingSessions: ExtendedSession[]
  pastSessions: ExtendedSession[]
  enrolledBatches: StudentEnrolledBatch[]
}

type TabType = 'schedule' | 'batches' | 'history'

export function StudentClassesClient({
  liveSessions,
  upcomingSessions,
  pastSessions,
  enrolledBatches,
}: StudentClassesClientProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<TabType>('schedule')

  // Real-time synchronization for live and scheduled session status updates
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('student_classes_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // 10s fallback polling to guarantee live updates even if WebSocket reconnected
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Classes & Timetable</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Join your live online classroom rooms or view in-person batch schedules
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setCurrentTab('schedule')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'schedule'
              ? 'bg-[#55C832] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Class Schedule
          {liveSessions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white animate-pulse">
              Live ({liveSessions.length})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('batches')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'batches'
              ? 'bg-[#55C832] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          My Batches & Timetable
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'batches' ? 'bg-[#318A25] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {enrolledBatches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentTab === 'history'
              ? 'bg-[#55C832] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Past Sessions
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              currentTab === 'history' ? 'bg-[#318A25] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {pastSessions.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Schedule View */}
      {currentTab === 'schedule' && (
        <div className="space-y-6">
          {/* Live Now Banner */}
          {liveSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                Live Sessions In Progress
              </h2>
              {liveSessions.map((session) => {
                const isOnline = session.class_mode === 'online'
                const friendlyDate = formatFriendlyDate(session.session_date)
                const timeRange = formatTimeRange(session.start_time, session.end_time)

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                        {isOnline ? <Video className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                            <span className="h-2 w-2 rounded-full bg-rose-600" />
                            CLASS IN PROGRESS
                          </span>
                          <span className="text-xs font-medium text-gray-600">{session.batch_name}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mt-1">
                          {session.notes || session.batch_name || 'Live Class Session'}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                          <span>Tutor: {session.tutor_name}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-700">{friendlyDate} ({timeRange})</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {isOnline ? (
                        <Link href={`/student/classroom/${session.id}`}>
                          <Button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md">
                            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                            Join Live Room
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-gray-700 bg-white border border-rose-200 px-3 py-1.5 rounded-xl">
                          In-Person Class Active
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Upcoming Classes */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Upcoming Classes
            </h2>

            {upcomingSessions.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-2xs">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">No scheduled classes</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Check your batch recurring timetables below or ask your tutor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingSessions.map((session) => {
                  const isOnline = session.class_mode === 'online'
                  const friendlyDate = formatFriendlyDate(session.session_date)
                  const timeRange = formatTimeRange(session.start_time, session.end_time)
                  const isToday = friendlyDate === 'Today'

                  return (
                    <div
                      key={session.id}
                      className={`rounded-2xl border bg-white p-5 shadow-2xs flex flex-col justify-between ${
                        isToday ? 'border-[#55C832]/40 ring-1 ring-[#55C832]/20' : 'border-gray-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#318A25]">{session.batch_name}</span>
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAFBEF] text-[#318A25] border border-[#55C832]/30">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {friendlyDate} • {timeRange}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {session.notes || session.batch_name || 'Scheduled Class'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Instructor: {session.tutor_name}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            isOnline
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-[#FAFBEF] text-[#318A25] border border-[#55C832]/30'
                          }`}
                        >
                          {isOnline ? 'Online Classroom' : 'In-Person Class'}
                        </span>

                        {isOnline ? (
                          <Link href={`/student/classroom/${session.id}`}>
                            <Button
                              size="sm"
                              className={`text-xs h-7 font-semibold ${
                                isToday
                                  ? 'bg-[#55C832] hover:bg-[#318A25] text-white shadow-xs'
                                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Video className="mr-1 h-3 w-3" />
                              {isToday ? 'Enter Classroom' : 'Class Room'}
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-gray-400">Classroom Location</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Enrolled Batches & Timetables */}
      {currentTab === 'batches' && (
        <div className="space-y-4">
          {enrolledBatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-2xs">
              <GraduationCap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">No batch enrollments found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                When your tutor assigns you to an online or offline batch cohort, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{batch.name}</h3>
                      <p className="text-xs text-gray-500">
                        {batch.subject || 'All Subjects'} • Tutor: {batch.tutor_name}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        batch.class_mode === 'online'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-[#FAFBEF] text-[#318A25] border border-[#55C832]/30'
                      }`}
                    >
                      {batch.class_mode}
                    </span>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 space-y-1.5 text-xs text-gray-600">
                    {batch.schedule && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#318A25] shrink-0" />
                        <span>Schedule: <strong>{batch.schedule}</strong></span>
                      </div>
                    )}
                    {batch.working_days && batch.working_days.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#318A25] shrink-0" />
                        <span>Days: {batch.working_days.join(', ')}</span>
                      </div>
                    )}
                    {batch.location && batch.class_mode !== 'online' && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#318A25] shrink-0" />
                        <span>Location: {batch.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: History */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          {pastSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-2xs">
              <p className="text-xs font-semibold text-gray-700">No past classes recorded yet</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
              {pastSessions.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{session.notes || session.batch_name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {session.tutor_name} • {formatFriendlyDate(session.session_date)} {session.start_time ? `• ${formatTimeRange(session.start_time, session.end_time)}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {session.status === 'completed' ? 'Completed' : 'Concluded'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
