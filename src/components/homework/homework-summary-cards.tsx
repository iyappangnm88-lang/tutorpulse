'use client'

import React from 'react'
import { Card, CardBody } from '@/components/ui/card'
import { BookOpen, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { HomeworkSummary } from '@/types'

interface HomeworkSummaryCardsProps {
  summary: HomeworkSummary
}

export function HomeworkSummaryCards({ summary }: HomeworkSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total Assignments */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Assignments
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
            {summary.total_assignments}
          </p>
          <p className="mt-1 text-xs text-gray-400">Created across all batches</p>
        </CardBody>
      </Card>

      {/* Active Tasks */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-blue-600">
            {summary.active}
          </p>
          <p className="mt-1 text-xs text-gray-400">In progress & on schedule</p>
        </CardBody>
      </Card>

      {/* Pending Submissions */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pending Submissions
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-yellow-600">
            {summary.pending_submissions}
          </p>
          <p className="mt-1 text-xs text-gray-400">Student tasks awaiting check</p>
        </CardBody>
      </Card>

      {/* Overdue */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Overdue
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-red-600">
            {summary.overdue}
          </p>
          <p className="mt-1 text-xs text-gray-400">Past due date with pending work</p>
        </CardBody>
      </Card>
    </div>
  )
}
