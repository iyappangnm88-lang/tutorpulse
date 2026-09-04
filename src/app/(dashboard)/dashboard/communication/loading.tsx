import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function CommunicationLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <SkeletonLine className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  )
}
