import React from 'react'
import { SkeletonLine, SkeletonCard } from '@/components/ui/loading-spinner'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="h-44 rounded-3xl bg-gray-200/80 p-6 sm:p-8 flex flex-col justify-between">
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-40 bg-gray-300" />
          <SkeletonLine className="h-8 w-64 bg-gray-300" />
          <SkeletonLine className="h-4 w-96 bg-gray-300" />
        </div>
        <div className="flex gap-2">
          <SkeletonLine className="h-8 w-28 rounded-xl bg-gray-300" />
          <SkeletonLine className="h-8 w-28 rounded-xl bg-gray-300" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <SkeletonLine className="h-8 w-8 rounded-xl" />
            <SkeletonLine className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Main Content Columns Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            <SkeletonLine className="h-6 w-48" />
            <SkeletonLine className="h-16 w-full rounded-xl" />
            <SkeletonLine className="h-16 w-full rounded-xl" />
          </div>
          <div className="h-48 rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <SkeletonLine className="h-6 w-36" />
            <SkeletonLine className="h-12 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-72 rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <SkeletonLine className="h-6 w-40" />
            <SkeletonLine className="h-16 w-full rounded-xl" />
            <SkeletonLine className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
