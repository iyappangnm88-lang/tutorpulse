import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Video, Calendar, Clock, CheckCircle2, Play, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getStudentConnectedTutors } from '@/lib/student-portal'

export const dynamic = 'force-dynamic'

export default async function StudentClassesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tutors = await getStudentConnectedTutors(user.id)
  const tutorIds = tutors.map((t) => t.tutorId)

  let liveSessions: any[] = []
  let scheduledSessions: any[] = []
  let pastSessions: any[] = []

  if (tutorIds.length > 0) {
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .order('session_date', { ascending: false })
      .limit(30)

    if (sessions) {
      const tutorMap = new Map(tutors.map((t) => [t.tutorId, t.fullName]))
      const formatted = sessions.map((s) => ({
        ...s,
        batch_name: s.batches?.name || 'Class',
        tutor_name: tutorMap.get(s.tutor_id) || 'Tutor',
      }))

      liveSessions = formatted.filter((s) => s.status === 'in_progress')
      scheduledSessions = formatted.filter((s) => s.status === 'scheduled')
      pastSessions = formatted.filter((s) => s.status === 'completed' || s.status === 'cancelled')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Live Classes & Schedule</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Join your live classes or view upcoming teaching sessions
        </p>
      </div>

      {/* Live Now Banner */}
      {liveSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
            Happening Right Now
          </h2>
          {liveSessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-600" />
                    LIVE CLASS IN SESSION
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    {session.topic || session.batch_name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Tutor: {session.tutor_name} • Batch: {session.batch_name}
                  </p>
                </div>
              </div>

              <Link href={`/student/classroom/${session.id}`}>
                <Button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md">
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Join Room Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Scheduled */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Upcoming Scheduled Classes
        </h2>
        {scheduledSessions.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-2xs">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">No scheduled classes</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Check back soon or ask your tutor for the next scheduled session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-indigo-600">{session.batch_name}</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      {session.session_date} • {session.start_time}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{session.topic || 'Scheduled Class'}</h3>
                  <p className="text-xs text-gray-500 mt-1">Tutor: {session.tutor_name}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Class Room Waiting</span>
                  <Link href={`/student/classroom/${session.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Class Info
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Completed Classes */}
      {pastSessions.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Past Classes
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
            {pastSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">{session.topic || session.batch_name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {session.tutor_name} • {session.session_date}
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
