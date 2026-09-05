'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { WifiOff, RefreshCw, Activity, ArrowLeft } from 'lucide-react'

export default function OfflinePage() {
  const [checking, setChecking] = useState(false)

  const handleRetry = () => {
    setChecking(true)
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 text-center">
        {/* TutorPulse Brand Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Offline Icon Badge */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600 mb-4 border border-rose-100">
          <WifiOff className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          You are currently offline
        </h1>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          TutorPulse requires an active internet connection to securely synchronize student records, attendance, and fee transactions. Your data is safeguarded in real time.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking connection...' : 'Retry Connection'}
          </button>

          <Link
            href="/"
            className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            TutorPulse &bull; Progressive Web App
          </p>
        </div>
      </div>
    </div>
  )
}
