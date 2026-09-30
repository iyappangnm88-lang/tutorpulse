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
  Flame,
  Zap,
} from 'lucide-react'
import type { Metadata } from 'next'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'

export const metadata: Metadata = {
  title: 'Nuzigo Overview — Connected Education Ecosystem',
  description:
    'Nuzigo brings tutors, students, and parents together in one modern platform for real academic growth, interactive classrooms, and transparent progress.',
}

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] p-1.5 text-white shadow-md shadow-[#55C832]/30">
              <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#172B4D] tracking-tight leading-none">
                Nuzigo
              </span>
              <span className="text-[10px] font-bold text-[#318A25] tracking-wide">
                Overview
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
            <a href="#ecosystem" className="hover:text-slate-900 transition-colors">
              Ecosystem
            </a>
          </nav>

          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-extrabold tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Connected Education Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
            A connected ecosystem for{' '}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#256e1d] bg-clip-text text-transparent">
              teaching, learning, and growth.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Nuzigo brings educators, learners, and parents together in one cohesive workspace built for actual academic progress, not administrative clutter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="btn-nuzigo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/for-tutors"
              className="btn-nuzigo-secondary text-sm font-bold px-6 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <Users className="h-4 w-4 text-[#318A25]" />
              <span>For Tutors</span>
            </Link>
            <Link
              href="/for-students"
              className="btn-nuzigo-secondary text-sm font-bold px-6 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <GraduationCap className="h-4 w-4 text-[#318A25]" />
              <span>For Students</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Ecosystem Pillars */}
      <section id="ecosystem" className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              The Nuzigo Pillars
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Four connected dimensions
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Every participant in education has a dedicated, interconnected experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-[#318A25] flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Tutor Workspace</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Streamlined batch rosters, in-stride student enrollment, schedules, and lesson prep.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Classroom 2.0</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Integrated WebRTC audio/video, multi-page digital whiteboard, screen share, and instant quizzes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Learning Loop</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Homework tracking, topic quizzes, attendance streaks, and milestone celebrations.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Parent Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Direct view into student attendance, test marks, and automated WhatsApp lesson updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Paths Callout */}
      {/* Gamified Tutoring Section: Real Implementation, Zero Gimmicks */}
      <section className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFBEF] border border-[#55C832]/30 text-[#318A25] text-xs font-black">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Behavioral Learning Psychology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              The Science of Gamified Tutoring
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              We replace passive video watching with active cognitive momentum. Every mechanic in Nuzigo is backed by actual platform code to reinforce consistency and mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Weekly Schedule Streaks */}
            <div className="p-6 rounded-3xl bg-[#FAFBEF]/70 border border-slate-200 space-y-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                <Flame className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-[#172B4D]">Weekly Timetable Streaks</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Streaks in Nuzigo are tied to your tutor's actual cohort schedule. Attend every scheduled batch session during the week to grow your weekly streak. Skip, and accountability resets.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-[#318A25] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Powered by Batch Attendance Records</span>
              </div>
            </div>

            {/* Feature 2: In-Class Rapid Questions */}
            <div className="p-6 rounded-3xl bg-[#FAFBEF]/70 border border-slate-200 space-y-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-[#172B4D]">Real-Time In-Class Quizzes</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Tutors push rapid-fire concept questions directly into the live classroom stream. Students submit answers instantly on mobile or desktop with immediate validation.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-[#318A25] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero Passive Lecture Fatigue</span>
              </div>
            </div>

            {/* Feature 3: XP & Gold Coins */}
            <div className="p-6 rounded-3xl bg-[#FAFBEF]/70 border border-slate-200 space-y-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-700 flex items-center justify-center font-bold">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-[#172B4D]">XP, Badges & Gold Coins</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Every homework submission, quiz completion, and punctuality streak adds XP to student profiles and credits Gold Coins in a verifiable transaction ledger.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-[#318A25] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verifiable Mastery Milestones</span>
              </div>
            </div>
          </div>

          {/* Gamification Philosophy Notice */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Not a video game — a habit-building academic system.</span>
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                We believe games with arbitrary spins distract from real education. Nuzigo’s mechanics reward diligence, focus, and peer accountability in real live classrooms.
              </p>
            </div>
            <Link
              href="/for-students"
              className="shrink-0 text-xs font-bold text-white bg-[#318A25] hover:bg-[#256e1d] px-4 py-2 rounded-xl transition-colors"
            >
              Explore Student Journey →
            </Link>
          </div>
        </div>
      </section>

      {/* Ready to pick your path */}
      <section className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Ready to pick your path?
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Choose your profile type to explore features or start immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200/90 space-y-5 flex flex-col justify-between hover:border-[#55C832] transition-all">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-[#55C832]/10 text-[#318A25] flex items-center justify-center font-bold">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-[#172B4D]">I Teach Students</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Set up your teaching practice, organize your batch cohorts, conduct live sessions, and track fees and student performance.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/for-tutors"
                  className="btn-nuzigo-secondary text-xs font-bold py-2.5 px-4 flex-1 text-center"
                >
                  Explore Features
                </Link>
                <Link
                  href="/signup?role=tutor"
                  className="btn-nuzigo-primary text-xs font-bold py-2.5 px-4 flex-1 text-center"
                >
                  Create Tutor Account
                </Link>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200/90 space-y-5 flex flex-col justify-between hover:border-[#55C832] transition-all">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-[#55C832]/10 text-[#318A25] flex items-center justify-center font-bold">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-[#172B4D]">I Want to Learn</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Join classes with your tutor, practice chapter concepts, submit assignments, and track your true academic progress.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/for-students"
                  className="btn-nuzigo-secondary text-xs font-bold py-2.5 px-4 flex-1 text-center"
                >
                  Explore Features
                </Link>
                <Link
                  href="/signup?role=student"
                  className="btn-nuzigo-primary text-xs font-bold py-2.5 px-4 flex-1 text-center"
                >
                  Start Learning
                </Link>
              </div>
            </div>
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
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">For Students</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
