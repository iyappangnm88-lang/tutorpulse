'use client'

import React from 'react'
import { Filter } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { ReportFilters, ReportDateRange, Batch, Student } from '@/types'

interface ReportFilterBarProps {
  filters: ReportFilters
  onFilterChange: (next: ReportFilters) => void
  batches: Batch[]
  students: Student[]
}

export function ReportFilterBar({
  filters,
  onFilterChange,
  batches,
  students,
}: ReportFilterBarProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Filter className="h-3.5 w-3.5 text-indigo-600" />
        <span>Report Filters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Time Period</label>
          <Select
            value={filters.range}
            onChange={(e) =>
              onFilterChange({ ...filters, range: e.target.value as ReportDateRange })
            }
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </Select>
        </div>

        {/* Batch Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>
          <Select
            value={filters.batchId || 'all'}
            onChange={(e) =>
              onFilterChange({ ...filters, batchId: e.target.value === 'all' ? undefined : e.target.value })
            }
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.subject ? `(${b.subject})` : ''}
              </option>
            ))}
          </Select>
        </div>

        {/* Student Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
          <Select
            value={filters.studentId || 'all'}
            onChange={(e) =>
              onFilterChange({ ...filters, studentId: e.target.value === 'all' ? undefined : e.target.value })
            }
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} {s.class_name ? `(${s.class_name})` : ''}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Custom Range Date Pickers */}
      {filters.range === 'custom' && (
        <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
