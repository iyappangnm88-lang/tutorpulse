'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ClassSessionStatus } from '@/types'

interface SessionStatusBadgeProps {
  status: ClassSessionStatus
  className?: string
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  switch (status) {
    case 'in_progress':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200',
            className
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          In Progress
        </span>
      )
    case 'completed':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200',
            className
          )}
        >
          Completed
        </span>
      )
    case 'cancelled':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 line-through decoration-rose-400',
            className
          )}
        >
          Cancelled
        </span>
      )
    case 'scheduled':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200',
            className
          )}
        >
          Scheduled
        </span>
      )
  }
}
