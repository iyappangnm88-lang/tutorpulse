import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function ReportsLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      <SkeletonLine className="h-8 w-64" />
      <SkeletonCard />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  )
}
