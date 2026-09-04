import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <SkeletonLine className="h-8 w-48" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
