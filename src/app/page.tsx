import React from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Coins,
  Video,
  Users,
  ClipboardCheck,
  Award,
  BookOpen,
  CreditCard,
  HeartHandshake,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Compass,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuzilo — Learning that feels alive',
  description:
    'The gamified, live online classroom and management platform for tutors and students. Interactive speed quizzes, daily streaks, gold coins, and powerful batch workflows.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-slate-900 selection:bg-[#58CC02] selection:text-white relative font-sans">
      {/* Background subtle mesh glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-[#58CC02]/10 via-transparent to-transparent pointer-events-none" />

      {/* Floating Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#58CC02] text-white font-black text-xl shadow-md shadow-[#58CC02]/30">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
                Nuzilo
              </span>
              <span className="text-[10px] font-bold text-[#3C9E00] tracking-wide">
                Learning that feels alive
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#path" className="hover:text-slate-900 transition-colors">
              Nuzilo Path
            </a>
            <a href="#classroom" className="hover:text-slate-900 transition-colors">
              Classroom 2.0
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Tutor Suite
            </a>
            <Link href="/explore" className="text-[#3C9E00] hover:text-[#58CC02] transition-colors flex items-center gap-1">
              <Compass className="h-3.5 w-3.5" />
              <span>Explore Tutors</span>
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
              href="/signup"
              className="btn-nuzilo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#58CC02]/15 border border-[#58CC02]/30 text-[#3C9E00] text-xs font-black tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Learning that feels alive • Classroom 2.0 & Gamification</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Where learning feels exciting, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#58CC02] via-[#3C9E00] to-indigo-600 bg-clip-text text-transparent">
              and tutors teach with ease.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Turn every class into a vibrant adventure. With the curved Nuzilo Path, live speed questions with virtual Gold Coins, and professional tutor batch management.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="btn-nuzilo-primary text-sm font-black px-7 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/explore"
              className="btn-nuzilo-secondary text-sm font-bold px-7 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Compass className="h-4 w-4 text-[#3C9E00]" />
              <span>Explore Verified Tutors</span>
            </Link>
          </div>

          {/* Gamification Highlights Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-extrabold shadow-2xs">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>Daily Streaks</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold shadow-2xs">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span>Virtual Gold Coins</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-extrabold shadow-2xs">
              <Zap className="h-3.5 w-3.5 text-violet-500" />
              <span>Level XP</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-2xs">
              <Trophy className="h-3.5 w-3.5 text-emerald-500" />
              <span>Classroom Badges</span>
            </span>
          </div>
        </div>

        {/* Live Classroom 2.0 Mockup Frame */}
        <div id="classroom" className="max-w-5xl mx-auto mt-14 sm:mt-18">
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-2 sm:p-3 shadow-2xl shadow-[#58CC02]/10">
            <div className="rounded-2xl bg-gray-950 p-4 sm:p-6 text-white space-y-4">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-gray-400 ml-2">Classroom 2.0 • Live Online Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                    🟢 Network: Excellent
                  </span>
                </div>
              </div>

              {/* Fast Answer Challenge preview banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-gray-900 to-indigo-950/80 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      ⚡ Fast Answer Challenge Live
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-md font-bold">
                      First 3 get +5 Coins 🪙
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    Which planet in our solar system has the highest number of moons?
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
                    Saturn (146 Moons) ✓
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-semibold text-xs">
                    Jupiter
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Nuzilo Path Experience Section */}
      <section id="path" className="py-20 border-t border-slate-200/80 bg-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#3C9E00] uppercase tracking-wider bg-[#58CC02]/15 px-3 py-1 rounded-full">
              Student Journey
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              The Curved Nuzilo Path
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Say goodbye to boring lists. Students progress through an interactive, curved visual path with unlockable nodes, milestone badges, and joyful celebration sounds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#FFFDF5] border-2 border-slate-100 hover:border-[#58CC02]/40 transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#58CC02]/20 text-[#3C9E00] flex items-center justify-center text-2xl font-black">
                🌱
              </div>
              <h3 className="text-base font-black text-slate-900">Step-by-Step Milestones</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Every topic is structured as a clear, achievable node on their path.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FFFDF5] border-2 border-slate-100 hover:border-[#58CC02]/40 transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-black">
                🪙
              </div>
              <h3 className="text-base font-black text-slate-900">Virtual Gold Coins</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Awarded for speed and attendance. Pure motivation without financial anxiety.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FFFDF5] border-2 border-slate-100 hover:border-[#58CC02]/40 transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center text-2xl font-black">
                🔥
              </div>
              <h3 className="text-base font-black text-slate-900">Daily Learning Streaks</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Build healthy study habits with streak counters that keep learners returning daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tutor Suite Features */}
      <section id="features" className="py-20 border-t border-slate-200/80 bg-[#fafafa] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full">
              Tutor Operating System
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Professional tools tutors trust.
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              All the power needed to manage offline and online batches, student attendance, fees, homework, and exams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#58CC02] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Learner Rosters</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Organize students into batches, track progress, grades, and parent contacts.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#58CC02] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Smart Attendance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                One-tap attendance with automatic gamified reward grants for participating students.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#58CC02] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Fee Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate fee structures, log payments, send receipts, and monitor outstanding dues.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#58CC02] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Homework & Tests</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Assign practice problems, record test marks, and track performance improvements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#58CC02] text-white font-black text-lg shadow-sm">
                  N
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  Nuzilo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Learning that feels alive.</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-600">
              <a href="#path" className="hover:text-slate-900 transition-colors">
                Nuzilo Path
              </a>
              <a href="#classroom" className="hover:text-slate-900 transition-colors">
                Classroom 2.0
              </a>
              <Link href="/explore" className="hover:text-slate-900 transition-colors">
                Explore Tutors
              </Link>
              <Link href="/login" className="hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-slate-900 transition-colors">
                Register
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Nuzilo. All rights reserved.</p>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 font-medium text-slate-600">
              <span>Designed & Developed by Kishore</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-500">Contact: 6381889943</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
