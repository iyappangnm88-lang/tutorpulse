import React from 'react'
import { redirect } from 'next/navigation'
import { Award, Calendar, CheckCircle2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentConnectedTutors } from '@/lib/student-portal'

export const dynamic = 'force-dynamic'

export default async function StudentTestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tutors = await getStudentConnectedTutors(user.id)
  const tutorIds = tutors.map((t) => t.tutorId)

  let testsList: any[] = []

  if (tutorIds.length > 0) {
    const { data } = await supabase
      .from('tests')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .order('test_date', { ascending: false })

    if (data) {
      testsList = data.map((t: any) => ({
        ...t,
        batch_name: t.batches?.name || 'Class Batch',
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tests & Marks</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Review your upcoming tests, quiz scores, and academic evaluations
        </p>
      </div>

      {testsList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No tests scheduled or recorded</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Upcoming tests and evaluated answer marks from your tutors will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testsList.map((test) => (
            <div
              key={test.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs hover:border-indigo-100 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="font-semibold text-indigo-600">{test.batch_name}</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" />
                    {test.test_date
                      ? new Date(test.test_date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Date TBA'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{test.title}</h3>
                {test.description && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{test.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">Total Marks: {test.total_marks || '100'}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {test.test_type ? test.test_type.toUpperCase() : 'TEST'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
