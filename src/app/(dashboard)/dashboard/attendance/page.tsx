import React from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { AttendanceSheet } from '@/components/attendance/attendance-sheet'
import { PageGuide } from '@/components/help/page-guide'
import { getBatches, getBatchEnrolledStudents } from '@/lib/batches'
import { getBatchAttendanceForDate } from '@/lib/attendance'
import type { Metadata } from 'next'
import type { EnrolledStudent, Attendance } from '@/types'

export const metadata: Metadata = {
  title: 'Attendance — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface AttendancePageProps {
  searchParams: Promise<{ batch?: string; date?: string }>
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const { batch: queryBatchId, date: queryDate } = await searchParams
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDate = queryDate || todayStr

  const { data: batches } = await getBatches()
  const activeBatches = batches.filter((b) => b.status === 'active')

  const selectedBatchId = queryBatchId || activeBatches[0]?.id || ''

  let enrolledStudents: EnrolledStudent[] = []
  let existingAttendance: Attendance[] = []

  if (selectedBatchId) {
    const [studentsRes, attendanceRes] = await Promise.all([
      getBatchEnrolledStudents(selectedBatchId),
      getBatchAttendanceForDate(selectedBatchId, selectedDate),
    ])
    enrolledStudents = studentsRes.data
    existingAttendance = attendanceRes.data
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageGuide topicId="attendance" defaultCollapsed={existingAttendance.length > 0} />

      <PageHeader
        title="Daily Attendance"
        description="Mark and review student presence, absences, and late arrivals per batch."
      />

      <AttendanceSheet
        batches={activeBatches}
        selectedBatchId={selectedBatchId}
        initialDate={selectedDate}
        enrolledStudents={enrolledStudents}
        existingAttendance={existingAttendance}
      />
    </div>
  )
}
