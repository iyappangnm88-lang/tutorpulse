import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function ParentLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <SkeletonLine className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
