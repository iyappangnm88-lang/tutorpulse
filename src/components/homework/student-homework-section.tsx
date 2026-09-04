'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import type { Homework, Batch } from '@/types'

interface StudentHomeworkItem {
  tracking_id: string
  status: 'Pending' | 'Completed' | 'Excused'
  completed_at: string | null
  notes: string | null
  homework: Homework & { batch: Batch }
}

interface StudentHomeworkSectionProps {
  assignments: StudentHomeworkItem[]
  metrics: {
    total_assigned: number
    completed: number
    pending: number
    overdue: number
  }
}

export function StudentHomeworkSection({
  assignments,
  metrics,
}: StudentHomeworkSectionProps) {
  const recent = assignments.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Homework & Tasks</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gray-50 text-center text-xs">
          <div>
            <p className="text-gray-400 text-[10px]">Assigned</p>
            <p className="font-bold text-gray-900 mt-0.5">{metrics.total_assigned}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Completed</p>
            <p className="font-bold text-green-700 mt-0.5">{metrics.completed}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Pending</p>
            <p className={`font-bold mt-0.5 ${metrics.pending > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {metrics.pending}
            </p>
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-500">
            No homework assigned to this student yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map((item) => {
              const isDone = item.status === 'Completed'
              const dueDate = item.homework.due_date
                ? new Date(item.homework.due_date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })
                : null

              return (
                <div
                  key={item.tracking_id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <Link
                      href={`/dashboard/homework/${item.homework.id}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                    >
                      {item.homework.title}
                    </Link>
                    <p className="text-gray-400 mt-0.5">
                      {item.homework.batch?.name} {dueDate ? `• Due ${dueDate}` : ''}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isDone
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Pending</span>
                      </>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
