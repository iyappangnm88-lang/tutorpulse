import React from 'react'
import { Loader2 } from 'lucide-react'

export default function StudentLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
      <p className="text-sm font-semibold text-gray-700">Loading your learning space...</p>
      <p className="text-xs text-gray-400 mt-1">Fetching your classes and updates</p>
    </div>
  )
}
