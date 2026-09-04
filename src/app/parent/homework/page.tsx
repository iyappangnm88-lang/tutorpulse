import React from 'react'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HomeworkProgressBar } from '@/components/homework/homework-progress-bar'
import { getParentHomework } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Homework Tasks — Parent Portal',
}

export const dynamic = 'force-dynamic'

interface ParentHomeworkPageProps {
  searchParams: Promise<{ child?: string }>
}

export default async function ParentHomeworkPage({ searchParams }: ParentHomeworkPageProps) {
  const { child: childId } = await searchParams
  const res = await getParentHomework(childId)

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
        <h1 className="text-xl font-bold text-gray-900">Homework & Assignments</h1>
        <p className="text-xs text-gray-500">Showing assigned tasks and completion status for {child.full_name}.</p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardBody className="p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500">Overall Homework Completion</p>
          <HomeworkProgressBar
            completed={stats.completed}
            total={stats.total}
            rate={stats.completion_rate}
          />
        </CardBody>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Assigned Tasks</h2>
        </CardHeader>
        <CardBody className="p-0">
          {records.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-400">No homework tasks assigned yet. You&apos;re all caught up! 🎉</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((r) => {
                const isDone = r.status === 'Completed'
                const dueDate = r.homework.due_date
                  ? new Date(r.homework.due_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No deadline'

                return (
                  <div key={r.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900 text-sm">{r.homework.title}</p>
                      <p className="text-gray-400">
                        {r.homework.batches?.name} • Due: {dueDate}
                      </p>
                      {r.homework.instructions && (
                        <p className="text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100 mt-1">
                          {r.homework.instructions}
                        </p>
                      )}
                    </div>

                    <Badge variant={isDone ? 'success' : 'warning'} className="gap-1 shrink-0">
                      {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{r.status}</span>
                    </Badge>
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
