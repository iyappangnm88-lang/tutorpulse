import React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { CalendarView } from '@/components/calendar/calendar-view'
import { syncAndGetSessionsForDateRange, formatDateKey, addDays } from '@/lib/class-sessions'
import { getBatches } from '@/lib/batches'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Calendar & Class Sessions — TutorPulse',
  description: 'View and manage scheduled class sessions, track active classes, and reschedule occurrences.',
}

export default async function CalendarPage() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  // Window for current month grid (Monday start, 42 days)
  const firstDay = new Date(y, m, 1)
  const firstDayWeekIndex = (firstDay.getDay() + 6) % 7
  const windowStart = addDays(firstDay, -firstDayWeekIndex)
  const windowEnd = addDays(windowStart, 41)

  const startDateStr = formatDateKey(windowStart)
  const endDateStr = formatDateKey(windowEnd)

  const [sessionsRes, batchesRes] = await Promise.all([
    syncAndGetSessionsForDateRange(startDateStr, endDateStr),
    getBatches(),
  ])

  const sessions = sessionsRes.data || []
  const batches = (batchesRes.data || []).filter((b) => b.status === 'active')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Calendar & Sessions"
        description="Monitor daily classes, launch sessions, manage attendance, and reschedule occurrences seamlessly."
      />

      <CalendarView initialSessions={sessions} batches={batches} />
    </div>
  )
}
