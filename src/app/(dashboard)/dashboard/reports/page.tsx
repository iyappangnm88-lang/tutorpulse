import React from 'react'
import { getReportAggregatedData } from '@/lib/reports'
import { getBatches } from '@/lib/batches'
import { getStudents } from '@/lib/students'
import { ReportsClient } from '@/components/reports/reports-client'
import { PageGuide } from '@/components/help/page-guide'
import type { ReportFilters, ReportDateRange } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports & Data Export — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface ReportsPageProps {
  searchParams: Promise<{
    range?: string
    start?: string
    end?: string
    batch?: string
    student?: string
  }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams

  const filters: ReportFilters = {
    range: (params.range as ReportDateRange) || 'this_month',
    startDate: params.start,
    endDate: params.end,
    batchId: params.batch,
    studentId: params.student,
  }

  const [reportData, batchesRes, studentsRes] = await Promise.all([
    getReportAggregatedData(filters),
    getBatches(),
    getStudents(),
  ])

  const batches = batchesRes.data || []
  const students = studentsRes.data || []

  if (!reportData) {
    return <div className="p-8 text-center text-xs text-gray-400">Failed to load reports.</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageGuide topicId="reports" defaultCollapsed={true} />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Understand student progress, attendance consistency, academic scores, homework, and fee collections.
        </p>
      </div>

      <ReportsClient
        initialData={reportData}
        batches={batches}
        students={students}
        initialFilters={filters}
      />
    </div>
  )
}
