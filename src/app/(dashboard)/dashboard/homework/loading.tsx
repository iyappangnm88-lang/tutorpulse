import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function HomeworkLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonLine className="h-8 w-48" />
          <SkeletonLine className="h-4 w-80" />
        </div>
        <SkeletonLine className="h-10 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="flex gap-3">
        <SkeletonLine className="h-10 flex-1 rounded-lg" />
        <SkeletonLine className="h-10 w-44 rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
