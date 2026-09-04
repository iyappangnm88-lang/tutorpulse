'use client'

import React from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { TestGradeBadge } from './test-grade-badge'
import type { StudentTestPerformance, Test, Batch } from '@/types'

interface StudentTestItem {
  mark_id: string
  marks: number | null
  status: string
  remarks: string | null
  percentage: number | null
  grade: string
  test: Test & { batch: Batch }
}

interface StudentTestsSectionProps {
  tests: StudentTestItem[]
  performance: StudentTestPerformance
}

export function StudentTestsSection({
  tests,
  performance,
}: StudentTestsSectionProps) {
  const recent = tests.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Tests & Examination Results</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-gray-50 text-center text-xs">
          <div>
            <p className="text-gray-400 text-[10px]">Tests Taken</p>
            <p className="font-bold text-gray-900 mt-0.5">{performance.total_tests}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Average</p>
            <p className="font-bold text-indigo-700 mt-0.5">
              {performance.average_percentage !== null ? `${performance.average_percentage}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Highest</p>
            <p className="font-bold text-green-700 mt-0.5">
              {performance.highest_percentage !== null ? `${performance.highest_percentage}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Lowest</p>
            <p className="font-bold text-yellow-700 mt-0.5">
              {performance.lowest_percentage !== null ? `${performance.lowest_percentage}%` : '—'}
            </p>
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-500">
            No test scores recorded for this student yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map((item) => {
              const testDate = new Date(item.test.test_date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })

              return (
                <div
                  key={item.mark_id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <Link
                      href={`/dashboard/tests/${item.test.id}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                    >
                      {item.test.title}
                    </Link>
                    <p className="text-gray-400 mt-0.5">
                      {item.test.batch?.name} • {testDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'Graded' && item.marks !== null ? (
                      <>
                        <span className="font-bold text-gray-900">
                          {item.marks} / {item.test.max_marks}
                        </span>
                        <span className="text-gray-500 font-medium">({item.percentage}%)</span>
                        <TestGradeBadge grade={item.grade} />
                      </>
                    ) : (
                      <span className="text-gray-400 font-medium">{item.status}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
