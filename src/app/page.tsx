import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PreLandingSelector } from '@/components/landing/pre-landing-selector'

export const metadata: Metadata = {
  title: 'Nuzigo — Learning, teaching, and growing together',
  description:
    'Nuzigo is the modern, connected education platform for independent tutors, curious students, and engaged parents. Choose your tailored experience.',
}

export default async function PreLandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: 'tutor' | 'student' | 'parent' | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = (profile?.role as any) || null
  }

  const dashboardHref =
    userRole === 'tutor'
      ? '/dashboard'
      : userRole === 'student'
      ? '/student'
      : userRole === 'parent'
      ? '/parent'
      : '/dashboard'

  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white flex flex-col justify-between font-sans">
      {/* Minimal Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] text-white font-black text-xl shadow-md shadow-[#55C832]/30">
              N
            </div>
            <span className="text-xl font-black text-[#172B4D] tracking-tight">
              NUZIGO
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={dashboardHref}
                className="btn-nuzilo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-slate-500 font-medium">
                  Already have an account?
                </span>
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-2xs"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Selection Body */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 mb-8 sm:mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-extrabold tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Learning, teaching, and growing together</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#172B4D] tracking-tight leading-tight">
            What brings you to Nuzigo?
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
            Choose your journey to access tailored tools, classrooms, and workflows built for you.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <PreLandingSelector />

        {/* Existing user note if logged in */}
        {user && (
          <div className="mt-8 text-center px-4">
            <p className="text-xs text-slate-500 font-medium">
              Signed in as <span className="font-bold text-slate-800">{user.email}</span>. You can jump directly to your{' '}
              <Link href={dashboardHref} className="text-[#318A25] font-bold underline hover:text-[#55C832]">
                Workspace Dashboard →
              </Link>
            </p>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Nuzigo. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <Link href="/for-tutors" className="hover:text-slate-900 transition-colors">
              For Tutors
            </Link>
            <span>•</span>
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">
              For Students
            </Link>
            <span>•</span>
            <Link href="/overview" className="hover:text-slate-900 transition-colors">
              Overview
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
