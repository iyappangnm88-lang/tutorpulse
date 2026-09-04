import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { TestGradeBadge } from '@/components/tests/test-grade-badge'
import { getParentTests } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tests & Marks — Parent Portal',
}

export const dynamic = 'force-dynamic'

interface ParentTestsPageProps {
  searchParams: Promise<{ child?: string }>
}

export default async function ParentTestsPage({ searchParams }: ParentTestsPageProps) {
  const { child: childId } = await searchParams
  const res = await getParentTests(childId)

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
        <h1 className="text-xl font-bold text-gray-900">Academic Tests & Marks</h1>
        <p className="text-xs text-gray-500">Showing test results and performance for {child.full_name}.</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Average Score</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {stats.average_percentage !== null ? `${stats.average_percentage}%` : '—'}
          </p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Overall Grade</p>
          <div className="mt-1 flex items-center justify-center">
            <TestGradeBadge grade={stats.grade} />
          </div>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Highest Score</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.highest_percentage !== null ? `${stats.highest_percentage}%` : '—'}
          </p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Tests Taken</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tests_taken}</p>
        </Card>
      </div>

      {/* Test Ledger */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Examination Results</h2>
        </CardHeader>
        <CardBody className="p-0">
          {records.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-400">No test results recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((item) => {
                const formattedDate = new Date(item.test_date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div key={item.mark_id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.test_title}</p>
                      <p className="text-gray-400 mt-0.5">
                        {item.batch_name} • {formattedDate}
                      </p>
                      {item.remarks && (
                        <p className="text-gray-600 mt-1 bg-gray-50 p-2 rounded border border-gray-100 italic">
                          Tutor Remarks: &ldquo;{item.remarks}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      {item.status === 'Graded' && item.marks !== null ? (
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {item.marks} / {item.max_marks}
                          </p>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="text-xs font-semibold text-gray-600">{item.percentage}%</span>
                            <TestGradeBadge grade={item.grade} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">{item.status}</span>
                      )}
                    </div>
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
