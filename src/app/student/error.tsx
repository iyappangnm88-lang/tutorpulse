'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
      <p className="mt-1 text-xs text-gray-500 max-w-md">
        {error.message || 'We encountered an error loading your student portal. Please try again.'}
      </p>
      <Button
        onClick={() => reset()}
        className="mt-5 text-xs bg-indigo-600 hover:bg-indigo-700"
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  )
}
