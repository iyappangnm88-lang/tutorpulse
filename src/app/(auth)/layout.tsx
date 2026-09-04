import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity } from 'lucide-react'

export const metadata: Metadata = {
  title: 'TutorPulse — Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-4 py-12 relative overflow-hidden">
      {/* Soft background ambient gradient */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-radial-gradient pointer-events-none" />

      {/* Brand Header */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-2.5 group">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
          <Activity className="h-6 w-6" />
        </div>
        <div className="text-center">
          <span className="text-2xl font-black text-gray-950 tracking-tight">TutorPulse</span>
          <p className="text-xs text-gray-500 font-medium">Simple tools for better tutoring</p>
        </div>
      </Link>

      {/* Card container */}
      <div className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 relative z-10">
        {children}
      </div>

      {/* Clean footer */}
      <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
        <p>&copy; {new Date().getFullYear()} TutorPulse. All rights reserved.</p>
        <p className="text-[11px] text-gray-500">Designed & Developed by Kishore • Contact: 6381889943</p>
      </div>
    </div>
  )
}
