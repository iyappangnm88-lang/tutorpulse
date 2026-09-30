import React from 'react'
import Link from 'next/link'
import {
  Users,
  Video,
  Layers,
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  BookOpen,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  PlayCircle,
  ShieldCheck,
  Monitor
} from 'lucide-react'
import type { Metadata } from 'next'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'

export const metadata: Metadata = {
  title: 'Nuzigo for Tutors — Teach Smarter. Keep Everything Connected',
  description:
    'Dedicated workspace for independent tutors. Create batches, prepare sessions, conduct interactive online classes, assign homework, and track student growth.',
}

export default function ForTutorsPage() {
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
                For Educators
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Tutor Workflow
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Classroom & Tools
            </a>
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">
              For Students
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
              href="/signup?role=tutor"
              className="btn-nuzilo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
            >
              <span>Create Tutor Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-extrabold tracking-wide">
            <Users className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Built For Independent Tutors & Coaching Mentors</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
            Teach smarter.{' '}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#256e1d] bg-clip-text text-transparent">
              Keep everything connected.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Run your entire teaching practice in one place: create batches, add students, schedule and prepare sessions, conduct interactive live classes, and track student growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup?role=tutor"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <span>Create Your Tutor Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="btn-nuzilo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <PlayCircle className="h-4 w-4 text-[#318A25]" />
              <span>See How It Works</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>In-Stride Student Enrollment</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Native Classroom & Whiteboard</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Automated Attendance & WhatsApp</span>
            </span>
          </div>
        </div>
      </section>

      {/* 5-Step Visual Workflow Section */}
      <section id="workflow" className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              The 5-Step Teaching Workflow
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Create ➔ Prepare ➔ Teach ➔ Check ➔ Track
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              A clear, frictionless operational flow designed to save you hours of admin work each week.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                name: 'Create',
                title: 'Batches & Roster',
                desc: 'Set up batches, add students directly in one flow, and set up your weekly schedule.',
                icon: Layers,
              },
              {
                step: '02',
                name: 'Prepare',
                title: 'Agendas & Quizzes',
                desc: 'Plan lesson notes, upload reference materials, and configure rapid-fire questions.',
                icon: Sparkles,
              },
              {
                step: '03',
                name: 'Teach',
                title: 'Live Classroom',
                desc: 'Host interactive sessions with multi-page whiteboard, screen share, and audio/video.',
                icon: Video,
              },
              {
                step: '04',
                name: 'Check',
                title: 'Homework & Tests',
                desc: 'Assign practice problems, collect student submissions, and record test marks.',
                icon: Award,
              },
              {
                step: '05',
                name: 'Track',
                title: 'Attendance & Fees',
                desc: '1-tap attendance, parent WhatsApp summaries, and clear fee dues tracking.',
                icon: ClipboardCheck,
              },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  className="bg-[#FAFBEF] rounded-3xl p-5 border-2 border-slate-100 hover:border-[#55C832]/50 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#318A25]/40">{s.step}</span>
                      <div className="h-8 w-8 rounded-xl bg-[#55C832]/20 text-[#318A25] flex items-center justify-center font-bold">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#318A25]">
                        {s.name}
                      </span>
                      <h3 className="font-extrabold text-[#172B4D] text-base">{s.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature Deep-Dive */}
      <section id="features" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              Integrated Tools
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Everything you need to run your classes
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              No need to piece together Zoom, spreadsheets, WhatsApp, and notebooks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Monitor className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Interactive Whiteboard & Classroom</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Draw, explain formulas, export PNGs, share screens, and trigger rapid-response questions directly during the class.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Smart Attendance & Streaks</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Log attendance in 10 seconds. Students build weekly learning streaks that boost attendance consistency.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-[#172B4D] text-base">Automated Fee Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Monitor paid and overdue tuition fees, log payments with receipts, and keep finances clear without awkward reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#172B4D] via-[#10203a] to-[#0a1424] text-white px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to teach smarter with Nuzigo?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-medium">
            Create your tutor account in less than 2 minutes and start organizing your batches today.
          </p>

          <div className="pt-2">
            <Link
              href="/signup?role=tutor"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 inline-flex items-center gap-2 shadow-xl"
            >
              <span>Create Your Tutor Account</span>
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
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">For Students</Link>
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
