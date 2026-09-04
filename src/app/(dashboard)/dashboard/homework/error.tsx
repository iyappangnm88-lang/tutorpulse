'use client'

import React, { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomeworkError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Homework route error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">Failed to load homework</h2>
      <p className="mt-1.5 text-sm text-gray-500">
        An error occurred while fetching homework assignments. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="primary" size="md" onClick={() => reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  )
}
