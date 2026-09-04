import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <svg
        className={cn('animate-spin text-indigo-600', sizeClasses[size])}
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  )
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-gray-200', className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="h-8 w-1/2" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  )
}
