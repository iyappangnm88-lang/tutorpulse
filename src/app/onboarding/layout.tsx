import React from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to Nuzilo — Onboarding',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF5] via-white to-[#FFFDF5] flex flex-col justify-between text-slate-900 selection:bg-[#58CC02] selection:text-white">
      {/* Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#58CC02] text-white font-black text-lg shadow-sm">
              N
            </div>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              Nuzilo
            </span>
          </Link>
          <span className="text-xs font-semibold text-slate-600">
            Account Setup
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 sm:py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/70 bg-white/60 text-center text-xs text-slate-600">
        Nuzilo &copy; {new Date().getFullYear()} • Learning that feels alive
      </footer>
    </div>
  )
}
