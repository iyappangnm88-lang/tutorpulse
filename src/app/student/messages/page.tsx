import React from 'react'
import { redirect } from 'next/navigation'
import { MessageSquare, Bell, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentConnectedTutors } from '@/lib/student-portal'

export const dynamic = 'force-dynamic'

export default async function StudentMessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tutors = await getStudentConnectedTutors(user.id)
  const tutorIds = tutors.map((t) => t.tutorId)

  let announcements: any[] = []

  if (tutorIds.length > 0) {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      announcements = data
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Announcements & Messages</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Important updates and notices from your connected tutors
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 mb-4">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No announcements yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When your tutors share class updates, timetable changes, or general notes, you will see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs hover:border-indigo-100 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                  <Bell className="h-3 w-3" />
                  Notice
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
