'use client'

import React from 'react'
import { Users, CalendarCheck, Award, BookOpen, CreditCard } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { formatCurrency } from '@/lib/fee-utils'
import type { ReportOverviewKPIs } from '@/types'

export function ReportKpiCards({ kpis }: { kpis: ReportOverviewKPIs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Students */}
      <Card>
        <CardBody className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Students</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">{kpis.total_students}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.active_students} active in roster</p>
          </div>
        </CardBody>
      </Card>

      {/* Attendance */}
      <Card>
        <CardBody className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Attendance</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">{kpis.overall_attendance_pct}%</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Average across sessions</p>
          </div>
        </CardBody>
      </Card>

      {/* Tests */}
      <Card>
        <CardBody className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Tests Avg</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-gray-900">
                {kpis.test_average_pct !== null ? `${kpis.test_average_pct}%` : '—'}
              </p>
              {kpis.test_grade !== '—' && (
                <span className="text-xs font-bold text-indigo-600">({kpis.test_grade})</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.tests_conducted} tests conducted</p>
          </div>
        </CardBody>
      </Card>

      {/* Homework */}
      <Card>
        <CardBody className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Homework</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">{kpis.homework_completion_rate}%</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.homework_assigned} assignments given</p>
          </div>
        </CardBody>
      </Card>

      {/* Fee Collection */}
      <Card className="col-span-2 sm:col-span-1">
        <CardBody className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Fee Collection</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-green-700">{formatCurrency(kpis.fees_total_collected)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatCurrency(kpis.fees_outstanding)} pending ({kpis.collection_rate}%)
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
