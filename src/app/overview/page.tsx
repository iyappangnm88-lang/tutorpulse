import React from 'react'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Video,
  ClipboardCheck,
  BookOpen,
  Award,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react'
import type { Metadata } from 'next'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Nuzigo Overview — Connected Education Platform',
  description:
    'Nuzigo is an education platform connecting tutoring, learning, and educational workflows in one cohesive workspace.',
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] p-1.5 text-white shadow-md shadow-[#55C832]/30">
              <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#172B4D] tracking-tight leading-none">
                NUZIGO
              </span>
              <span className="text-[10px] font-bold text-[#318A25] tracking-wide">
                Platform Overview
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link href="/for-tutors" className="hover:text-slate-900 transition-colors">
              For Tutors
            </Link>
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">
              For Students
            </Link>
            <Link href="/tutors" className="hover:text-slate-900 transition-colors">
              Marketplace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Hero */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-black tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Connecting Tutoring, Learning & Operations</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#172B4D] tracking-tight leading-tight">
              One platform for modern education.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Nuzigo is an education platform connecting tutoring discovery, live interactive classrooms, batch management, and transparent student progress into one simple workspace.
            </p>
          </div>

          {/* Three Perspectives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border-2 border-slate-200/90 space-y-4 flex flex-col justify-between shadow-xs hover:border-[#55C832]/60 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-[#55C832]/20 text-[#318A25] flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-[#172B4D]">For Educators</h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Build a verified discovery profile on the marketplace, manage cohorts, teach with digital whiteboards, and track student growth.
                </p>
              </div>
              <Link
                href="/for-tutors"
                className="text-xs font-bold text-[#318A25] hover:text-[#256e1d] flex items-center gap-1 pt-2"
              >
                <span>Explore Tutor Features</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="bg-white p-7 rounded-3xl border-2 border-slate-200/90 space-y-4 flex flex-col justify-between shadow-xs hover:border-[#55C832]/60 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-[#172B4D]">For Learners</h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Connect with experienced tutors, attend live classes, solve instant rapid quizzes, submit assignments, and build study streaks.
                </p>
              </div>
              <Link
                href="/for-students"
                className="text-xs font-bold text-[#318A25] hover:text-[#256e1d] flex items-center gap-1 pt-2"
              >
                <span>Explore Student Features</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="bg-white p-7 rounded-3xl border-2 border-slate-200/90 space-y-4 flex flex-col justify-between shadow-xs hover:border-[#55C832]/60 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-[#172B4D]">For Parents</h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Transparent real-time visibility into attendance timestamps, reviewed homework marks, test results, and fee payment receipts.
                </p>
              </div>
              <Link
                href="/login"
                className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1 pt-2"
              >
                <span>Parent Portal Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Simple CTA */}
          <div className="bg-gradient-to-br from-[#172B4D] via-[#10203a] to-[#0a1424] text-white p-8 sm:p-10 rounded-3xl text-center space-y-5 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-black">
              Ready to explore Nuzigo?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-medium">
              Join educators, learners, and families building better learning habits together.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/for-tutors"
                className="btn-nuzigo-primary text-xs font-black px-6 py-3 flex items-center gap-1.5 shadow-md"
              >
                <span>I Teach Students</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/for-students"
                className="btn-nuzigo-secondary text-xs font-bold px-6 py-3 bg-white text-slate-900"
              >
                <span>I Want to Learn</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-6 text-xs text-slate-500 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} NUZIGO. All rights reserved.</p>
          <div className="flex items-center gap-4 font-bold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">Choose Role</Link>
            <span>•</span>
            <Link href="/for-tutors" className="hover:text-slate-900 transition-colors">For Tutors</Link>
            <span>•</span>
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">For Students</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
