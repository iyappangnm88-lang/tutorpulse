'use client'

import React, { useState } from 'react'
import { ReportFilterBar } from './report-filter-bar'
import { ReportKpiCards } from './report-kpi-cards'
import { AttendanceReportTable } from './attendance-report-table'
import { PerformanceReportTable } from './performance-report-table'
import { BatchComparisonTable } from './batch-comparison-table'
import { HomeworkReportTable } from './homework-report-table'
import { FeeReportTable } from './fee-report-table'
import { ExportDropdown } from './export-dropdown'
import { StudentReportModal } from './student-report-modal'
import { useRouter } from 'next/navigation'
import { fetchStudentReportAction } from '@/app/(dashboard)/dashboard/reports/actions'
import type {
  ReportFilters,
  ReportAggregatedData,
  Batch,
  Student,
  ConsolidatedStudentReport,
} from '@/types'

interface ReportsClientProps {
  initialData: ReportAggregatedData
  batches: Batch[]
  students: Student[]
  initialFilters: ReportFilters
}

export function ReportsClient({
  initialData,
  batches,
  students,
  initialFilters,
}: ReportsClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [activeTab, setActiveTab] = useState<'attendance' | 'performance' | 'batches' | 'homework' | 'fees'>('attendance')
  const [selectedStudentReport, setSelectedStudentReport] = useState<ConsolidatedStudentReport | null>(null)
  const [loadingStudentModal, setLoadingStudentModal] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleFilterChange(next: ReportFilters) {
    setFilters(next)
    const params = new URLSearchParams()
    if (next.range) params.set('range', next.range)
    if (next.startDate) params.set('start', next.startDate)
    if (next.endDate) params.set('end', next.endDate)
    if (next.batchId && next.batchId !== 'all') params.set('batch', next.batchId)
    if (next.studentId && next.studentId !== 'all') params.set('student', next.studentId)
    router.push(`/dashboard/reports?${params.toString()}`)
  }

  async function handleOpenStudentModal(studentId: string) {
    setIsModalOpen(true)
    setLoadingStudentModal(true)
    try {
      const res = await fetchStudentReportAction(studentId)
      setSelectedStudentReport(res)
    } finally {
      setLoadingStudentModal(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <ReportFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        batches={batches}
        students={students}
      />

      {/* KPI Cards */}
      <ReportKpiCards kpis={initialData.kpis} />

      {/* Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200 self-start overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'attendance'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Attendance ({initialData.attendanceRows.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'performance'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tests & Marks ({initialData.performanceRows.length})
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'batches'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Batches ({initialData.batchRows.length})
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'homework'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Homework ({initialData.homeworkRows.length})
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'fees'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fees & Dues ({initialData.feeRows.length})
          </button>
        </div>

        <ExportDropdown data={initialData} />
      </div>

      {/* Tab Content */}
      {activeTab === 'attendance' && (
        <AttendanceReportTable
          rows={initialData.attendanceRows}
          onSelectStudent={handleOpenStudentModal}
        />
      )}

      {activeTab === 'performance' && (
        <PerformanceReportTable
          rows={initialData.performanceRows}
          onSelectStudent={handleOpenStudentModal}
        />
      )}

      {activeTab === 'batches' && <BatchComparisonTable rows={initialData.batchRows} />}

      {activeTab === 'homework' && (
        <HomeworkReportTable
          rows={initialData.homeworkRows}
          onSelectStudent={handleOpenStudentModal}
        />
      )}

      {activeTab === 'fees' && (
        <FeeReportTable
          rows={initialData.feeRows}
          onSelectStudent={handleOpenStudentModal}
        />
      )}

      {/* Student Consolidated Report Modal */}
      <StudentReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={selectedStudentReport}
        loading={loadingStudentModal}
      />
    </div>
  )
}
