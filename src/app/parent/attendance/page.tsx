import React from 'react'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getParentAttendance } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Attendance Record — Parent Portal',
}

export const dynamic = 'force-dynamic'

interface ParentAttendancePageProps {
  searchParams: Promise<{ child?: string }>
}

export default async function ParentAttendancePage({ searchParams }: ParentAttendancePageProps) {
  const { child: childId } = await searchParams
  const res = await getParentAttendance(childId)

  if (res.error || !res.data) {
    return <div className="p-6 text-center text-red-600">{res.error}</div>
  }

  const { child, records, stats } = res.data

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/parent?child=${child.student_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Attendance Record</h1>
        <p className="text-xs text-gray-500">Showing classes and sessions for {child.full_name}.</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Overall Attendance</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.percentage}%</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Total Classes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Present</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.present}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</p>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Class Session History</h2>
        </CardHeader>
        <CardBody className="p-0">
          {records.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-400">No attendance records logged yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((r) => {
                const isPresent = r.status === 'present'
                const isAbsent = r.status === 'absent'
                const formattedDate = new Date(r.attendance_date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{formattedDate}</p>
                      <p className="text-gray-400 mt-0.5">{r.batches?.name || 'Class Session'}</p>
                      {r.note && <p className="text-gray-600 mt-1 italic">&ldquo;{r.note}&rdquo;</p>}
                    </div>

                    <Badge
                      variant={isPresent ? 'success' : isAbsent ? 'danger' : 'warning'}
                      className="gap-1 capitalize"
                    >
                      {isPresent ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isAbsent ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span>{r.status}</span>
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
