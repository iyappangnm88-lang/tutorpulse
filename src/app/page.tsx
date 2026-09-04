import React from 'react'
import Link from 'next/link'
import {
  Activity,
  Users,
  ClipboardCheck,
  Award,
  BookOpen,
  CreditCard,
  HeartHandshake,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TutorPulse — Simple Tools for Better Tutoring',
  description:
    'Manage students, attendance, homework, tests, fees, parents, communication, and reports — all in one simple workspace.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] selection:bg-indigo-500 selection:text-white relative">
      {/* Background subtle mesh glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-radial-gradient pointer-events-none" />

      {/* Floating Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-base font-extrabold text-gray-900 tracking-tight">
              TutorPulse
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#trust" className="hover:text-gray-900 transition-colors">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs shadow-indigo-500/20 active:scale-[0.98] transition-all"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Built specifically for solo tutors & small tuition centers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-950 tracking-tight leading-[1.1]">
            Tutor management, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              without the chaos.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Manage students, attendance, homework, tests, fees, parents, communication, and reports — all in one simple workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 border border-gray-200/90 shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Product Preview in Realistic Device Frame */}
        <div className="max-w-5xl mx-auto mt-14 sm:mt-18">
          <div className="rounded-3xl border border-gray-200/90 bg-white p-2 sm:p-3 shadow-2xl shadow-indigo-500/10">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:p-6 space-y-4">
              {/* Browser window header */}
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="px-4 py-1 rounded-lg bg-white border border-gray-200/80 text-[11px] font-mono text-gray-500">
                  tutorpulse.app/dashboard
                </div>
                <div className="h-3 w-12" />
              </div>

              {/* Realistic Mockup Dashboard Widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Students</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">38</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">3 batches active</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Attendance</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">94%</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Consistent this month</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Collected</p>
                  <p className="text-xl font-bold text-emerald-600 mt-0.5">₹42,000</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">91% collection rate</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Homework</p>
                  <p className="text-xl font-bold text-indigo-600 mt-0.5">89%</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Practice completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-gray-200/80 bg-white px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Features</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Everything you need to run your tutoring smoothly.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Designed for speed, clarity, and mobile-first convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Students */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Students</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manage every learner in one place. Roster, search, grade, and active states.
              </p>
            </div>

            {/* 2. Attendance */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Attendance</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Mark attendance in seconds. Rapid touch-friendly roll call and low attendance alerts.
              </p>
            </div>

            {/* 3. Tests */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Tests</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Track performance and progress. Automatic percentage, letter grading, and rank tracking.
              </p>
            </div>

            {/* 4. Homework */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Homework</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Keep assignments organized. Batch-wide distribution and single-click completion updates.
              </p>
            </div>

            {/* 5. Fees */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Fees</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Know exactly what is collected and outstanding. Decimal-safe ledger and receipts.
              </p>
            </div>

            {/* 6. Parents */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Parents</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Give parents a secure view of their child’s progress with a dedicated view-only portal.
              </p>
            </div>

            {/* 7. Communication */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Communication</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Send announcements and 1-click WhatsApp fee reminders with pre-filled details.
              </p>
            </div>

            {/* 8. Reports */}
            <div className="p-5 rounded-2xl border border-gray-200/80 bg-[#fafafa] hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Reports</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Understand what is working and what needs attention with interactive filters and CSV exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-gray-200/80 bg-[#fafafa] px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Workflow</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Three simple steps to calm coaching operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
              <span className="text-2xl font-black text-indigo-600">01</span>
              <h3 className="text-base font-bold text-gray-900">Add</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Add students, parents, and batches in just a few minutes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
              <span className="text-2xl font-black text-indigo-600">02</span>
              <h3 className="text-base font-bold text-gray-900">Track</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Track attendance, tests, homework, and fee dues effortlessly each day.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
              <span className="text-2xl font-black text-indigo-600">03</span>
              <h3 className="text-base font-bold text-gray-900">Grow</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Use reports and student progress insights to run your tuition better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="trust" className="py-20 border-t border-gray-200/80 bg-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gray-50/80 border border-gray-200/80 p-8 sm:p-12 text-center space-y-6">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Private, isolated, and tutor-controlled
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
              Your data belongs strictly to you. Row Level Security ensures complete tenant isolation, while parents can only view their own linked children.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 font-medium">Tutor Data Isolation</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 font-medium">Private Parent Access</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 font-medium">No Public Directory</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (with Kishore credit & contact) */}
      <footer className="border-t border-gray-200/90 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">
                  TutorPulse
                </span>
              </div>
              <p className="text-xs text-gray-500">Simple tools for better tutoring.</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-gray-600">
              <a href="#features" className="hover:text-gray-900 transition-colors">
                Product
              </a>
              <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
                Features
              </a>
              <Link href="/login" className="hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-gray-900 transition-colors">
                Register
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>&copy; 2026 TutorPulse. All rights reserved.</p>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 font-medium text-gray-600">
              <span>Designed & Developed by Kishore</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-gray-500">Contact: 6381889943</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
