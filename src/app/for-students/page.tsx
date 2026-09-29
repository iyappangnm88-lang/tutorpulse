import React from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Video,
  Award,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles,
  BarChart3,
  CalendarCheck,
  HeartHandshake
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuzigo for Students — Learn. Practice. Progress.',
  description:
    'Stay on track, learn with your tutors in interactive online classes, solve chapter quizzes, complete homework, and build healthy study habits with Nuzigo.',
}

export default function ForStudentsPage() {
  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] text-white font-black text-xl shadow-md shadow-[#55C832]/30">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#172B4D] tracking-tight leading-none">
                Nuzigo
              </span>
              <span className="text-[10px] font-bold text-[#318A25] tracking-wide">
                For Students & Parents
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              How You Learn
            </a>
            <a href="#habits" className="hover:text-slate-900 transition-colors">
              Study Streaks
            </a>
            <Link href="/for-tutors" className="hover:text-slate-900 transition-colors">
              For Tutors
            </Link>
            <Link href="/overview" className="hover:text-slate-900 transition-colors">
              Overview
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup?role=student"
              className="btn-nuzilo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-extrabold tracking-wide">
            <GraduationCap className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Engaging Learning For Better Academic Growth</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
            Learn. Practice.{' '}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#256e1d] bg-clip-text text-transparent">
              Progress every day.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Join your tutor’s live classes, practice chapter questions, submit assignments on time, and build strong study habits with visual progress milestones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup?role=student"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/overview"
              className="btn-nuzilo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <Sparkles className="h-4 w-4 text-[#318A25]" />
              <span>Explore Nuzigo</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Interactive Live Sessions</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Homework & Deadline Tracking</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Weekly Attendance Streaks</span>
            </span>
          </div>
        </div>
      </section>

      {/* Student Pillars */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              Your Student Workspace
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Designed to help you master concepts
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Everything in Nuzigo is designed around real academic retention and consistent effort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#55C832]/20 text-[#318A25] flex items-center justify-center font-bold">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Live Interactive Classroom</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Attend online classes with crystal-clear audio, digital whiteboard explanations, and live in-class rapid quizzes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Homework & Tests</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                See all pending assignments and tests in one organized feed. Submit tasks and review feedback directly.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Visual Progress & Milestones</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Track your topic mastery and celebrate milestones as you complete lessons, tests, and attendance streaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Habit Streaks & Parent Connection */}
      <section id="habits" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200/90 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-[#172B4D]">Build Healthy Study Habits</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Consistency beats cramming. Nuzigo’s weekly schedule streaks encourage students to show up, prepare, and stay engaged session after session.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200/90 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-[#172B4D]">Connected Parent Portal</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Parents get a dedicated portal to view attendance, exam scores, and teacher updates with zero guesswork and complete peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#172B4D] via-[#10203a] to-[#0a1424] text-white px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to start learning with Nuzigo?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-medium">
            Join your teacher’s batch or connect with an invite code today.
          </p>

          <div className="pt-2">
            <Link
              href="/signup?role=student"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 inline-flex items-center gap-2 shadow-xl"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 text-xs text-slate-500 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Nuzigo. All rights reserved.</p>
          <div className="flex items-center gap-4 font-bold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">Choose Role</Link>
            <span>•</span>
            <Link href="/for-tutors" className="hover:text-slate-900 transition-colors">For Tutors</Link>
            <span>•</span>
            <Link href="/overview" className="hover:text-slate-900 transition-colors">Overview</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
