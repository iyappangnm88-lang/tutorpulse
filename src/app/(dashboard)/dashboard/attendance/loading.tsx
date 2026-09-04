import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function AttendanceLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-72" />
      </div>

      <SkeletonCard />

      <div className="space-y-3">
        <SkeletonLine className="h-14 w-full rounded-xl" />
        <SkeletonLine className="h-14 w-full rounded-xl" />
        <SkeletonLine className="h-14 w-full rounded-xl" />
      </div>
    </div>
  )
}
