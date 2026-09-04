'use client'

import React from 'react'
import { Card, CardBody } from '@/components/ui/card'
import { FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import type { TestSummary } from '@/types'

interface TestSummaryCardsProps {
  summary: TestSummary
}

export function TestSummaryCards({ summary }: TestSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total Tests */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Tests
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
            {summary.total_tests}
          </p>
          <p className="mt-1 text-xs text-gray-400">Scheduled across all batches</p>
        </CardBody>
      </Card>

      {/* Completed */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Completed
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-green-600">
            {summary.completed}
          </p>
          <p className="mt-1 text-xs text-gray-400">All marks entered & graded</p>
        </CardBody>
      </Card>

      {/* Upcoming */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Upcoming
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-blue-600">
            {summary.upcoming}
          </p>
          <p className="mt-1 text-xs text-gray-400">Future scheduled tests</p>
        </CardBody>
      </Card>

      {/* Average Performance */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Avg Performance
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-yellow-600">
            {summary.average_performance !== null ? `${summary.average_performance}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">Overall class score average</p>
        </CardBody>
      </Card>
    </div>
  )
}
