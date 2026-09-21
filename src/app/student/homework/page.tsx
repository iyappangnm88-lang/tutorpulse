import React from 'react'
import { redirect } from 'next/navigation'
import { BookOpen, Calendar, CheckCircle2, Clock, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentConnectedTutors } from '@/lib/student-portal'

export const dynamic = 'force-dynamic'

export default async function StudentHomeworkPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tutors = await getStudentConnectedTutors(user.id)
  const tutorIds = tutors.map((t) => t.tutorId)

  let homeworkList: any[] = []

  if (tutorIds.length > 0) {
    const { data } = await supabase
      .from('homework')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .order('due_date', { ascending: false })

    if (data) {
      homeworkList = data.map((hw: any) => ({
        ...hw,
        batch_name: hw.batches?.name || 'Class Batch',
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Homework & Assignments</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          View assigned exercises, worksheets, and project tasks
        </p>
      </div>

      {homeworkList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No homework assigned</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You are all caught up! When your tutors assign exercises or tasks, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworkList.map((hw) => (
            <div
              key={hw.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs hover:border-indigo-100 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">{hw.batch_name}</span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due:{' '}
                      {hw.due_date
                        ? new Date(hw.due_date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No deadline'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{hw.title}</h3>
                  {hw.description && (
                    <p className="text-xs text-gray-600 whitespace-pre-line mt-2">
                      {hw.description}
                    </p>
                  )}
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-100">
                    Assigned
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
