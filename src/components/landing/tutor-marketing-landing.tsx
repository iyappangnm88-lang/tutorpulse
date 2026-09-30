'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Video,
  Layers,
  ArrowRight,
  ClipboardCheck,
  BookOpen,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Flame,
  Zap,
  DollarSign,
  Search,
  MessageSquare,
  BarChart3,
  Share2,
  Hand,
  Volume2,
  Monitor,
  PenTool,
  Check,
  Eye,
} from 'lucide-react'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'

interface TutorMarketingLandingProps {
  currentUser?: {
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
}

export function TutorMarketingLanding({ currentUser }: TutorMarketingLandingProps) {
  // Interactive mock tutor profile state
  const [hasConnected, setHasConnected] = useState(false)

  // Interactive workspace cards state
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'students' | 'batches' | 'schedule' | 'classroom' | 'homework' | 'tests' | 'attendance' | 'progress'
  >('batches')

  // Interactive classroom simulation state
  const [activeView, setActiveView] = useState<'video' | 'whiteboard'>('video')
  const [handRaised, setHandRaised] = useState(false)
  const [quizState, setQuizState] = useState<'idle' | 'answered'>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  const WORKSPACE_TOOLS = [
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      headline: 'Manage your students and connections',
      desc: 'Centralized roster of all active students, batch enrollments, pending join requests, and direct parent contacts.',
      previewTag: 'Student Directory',
      previewContent: {
        badge: '18 Active Students',
        highlight: '3 Pending Requests',
        items: [
          { name: 'Aarav Sharma', batch: 'Grade 10 Physics', status: 'Enrolled' },
          { name: 'Ananya Iyer', batch: 'Grade 11 Mathematics', status: 'Enrolled' },
          { name: 'Rohan Verma', batch: 'Grade 10 Physics', status: 'Join Requested' },
        ],
      },
    },
    {
      id: 'batches',
      label: 'Batches',
      icon: Layers,
      headline: 'Organize students into teaching groups',
      desc: 'Group students by grade, syllabus, and timetable. Set recurring weekly meeting schedules with automatic invite codes.',
      previewTag: 'Batch Management',
      previewContent: {
        badge: '4 Active Batches',
        highlight: 'Tue & Thu • 5:00 PM',
        items: [
          { name: 'CBSE Class 10 — Physics Masters', batch: '6 / 8 Students', status: 'Next: Today 5 PM' },
          { name: 'ICSE Class 11 — Calculus Advanced', batch: '5 / 6 Students', status: 'Next: Tomorrow 6 PM' },
          { name: 'Foundation Science Sprint', batch: '8 / 10 Students', status: 'Next: Sat 10 AM' },
        ],
      },
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      headline: 'Plan upcoming classes effortlessly',
      desc: 'Visual weekly timetable synchronized across your devices. Students receive class reminders automatically before each session.',
      previewTag: 'Timetable Sync',
      previewContent: {
        badge: 'Weekly Schedule',
        highlight: '3 Classes Today',
        items: [
          { name: '05:00 PM - 06:00 PM', batch: 'Class 10 Physics • Newton Laws', status: 'Ready to Start' },
          { name: '06:30 PM - 07:30 PM', batch: 'Class 11 Math • Derivatives', status: 'Scheduled' },
          { name: '08:00 PM - 09:00 PM', batch: 'Doubt Clearing Clinic', status: 'Scheduled' },
        ],
      },
    },
    {
      id: 'classroom',
      label: 'Classroom',
      icon: Video,
      headline: 'Run online classes in one unified space',
      desc: 'Native audio/video, multi-page collaborative whiteboard, screen share, and instant rapid questions — all without third-party meeting links.',
      previewTag: 'Live WebRTC',
      previewContent: {
        badge: 'Live Session #104',
        highlight: 'Low Latency P2P',
        items: [
          { name: 'Digital Whiteboard', batch: 'Page 3 of 5 active', status: 'Synced' },
          { name: 'Screen Sharing', batch: 'Presentation Mode', status: 'Active' },
          { name: 'Rapid Question', batch: 'Formula check #2', status: '100% Responded' },
        ],
      },
    },
    {
      id: 'homework',
      label: 'Homework',
      icon: BookOpen,
      headline: 'Assign and manage learning work',
      desc: 'Set assignments with explicit deadlines. Students upload solutions and receive grading, corrections, and comments directly in their portal.',
      previewTag: 'Assignment Workflow',
      previewContent: {
        badge: '2 Due This Week',
        highlight: '14 / 16 Submitted',
        items: [
          { name: 'Kinematics Problem Set 3', batch: 'Due Thursday 11:59 PM', status: '8 Submissions to Review' },
          { name: 'Thermodynamics Diagram Sheet', batch: 'Due Friday', status: '6 Reviewed' },
        ],
      },
    },
    {
      id: 'tests',
      label: 'Tests',
      icon: Award,
      headline: 'Create and track assessments',
      desc: 'Record unit tests, mock exams, and chapter quizzes. Automatically compute class averages and identify topics needing revision.',
      previewTag: 'Assessment Tracker',
      previewContent: {
        badge: 'Recent Assessment',
        highlight: 'Class Average: 84%',
        items: [
          { name: 'Chapter 4 Diagnostic Test', batch: 'Max Marks: 50', status: 'Class Avg: 42/50' },
          { name: 'Mid-Term Physics Mock', batch: 'Max Marks: 100', status: 'Completed' },
        ],
      },
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: ClipboardCheck,
      headline: 'Monitor class attendance in 10 seconds',
      desc: 'One-tap attendance logging during or after class. Attendance records feed into student streaks and keep parents reliably informed.',
      previewTag: 'Punctuality Engine',
      previewContent: {
        badge: 'Today’s Attendance',
        highlight: '94% Monthly Rate',
        items: [
          { name: 'Physics Masters (Session #14)', batch: '6 Present • 0 Absent', status: 'Logged' },
          { name: 'Weekly Schedule Streak', batch: 'Cohort at 4-week streak', status: 'Active Flame' },
        ],
      },
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: BarChart3,
      headline: 'Understand student learning activity',
      desc: 'Transparent topic mastery insights, completion rates, and learning consistency charts showing exactly where each learner excels or struggles.',
      previewTag: 'Mastery Analytics',
      previewContent: {
        badge: 'Cohort Mastery',
        highlight: '88% Syllabus Covered',
        items: [
          { name: 'Mechanics & Force', batch: '92% Average Comprehension', status: 'Mastered' },
          { name: 'Work, Power & Energy', batch: '78% Average Comprehension', status: 'In Progress' },
        ],
      },
    },
  ]

  const activeTool = WORKSPACE_TOOLS.find((t) => t.id === activeWorkspaceTab)!

  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white font-sans">
      {/* Sticky Top Header */}
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
                For Tutors
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#marketplace" className="hover:text-slate-900 transition-colors">
              Marketplace
            </a>
            <a href="#workspace" className="hover:text-slate-900 transition-colors">
              Teaching Workspace
            </a>
            <a href="#classroom" className="hover:text-slate-900 transition-colors">
              Live Classroom
            </a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Workflow
            </a>
            <a href="#onboarding" className="hover:text-slate-900 transition-colors">
              How to Start
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
              >
                <span>Go to Dashboard</span>
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
                  href="/signup?role=tutor"
                  className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
                >
                  <span>Create Tutor Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Part 2: HERO */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-black tracking-wide">
            <Users className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Dedicated Workspace for Independent Educators</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
            Teach. Connect.{' '}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#256e1d] bg-clip-text text-transparent">
              Grow with Nuzigo.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Nuzigo brings tutor discovery, student connections, teaching tools, classroom tools, and progress tracking into one cohesive platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup?role=tutor"
              className="btn-nuzigo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <span>Create Your Tutor Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#marketplace"
              className="btn-nuzigo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <span>Explore Marketplace & Features</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Professional Discovery Profile</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Native Classroom & Whiteboard</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Transparent Session Pricing</span>
            </span>
          </div>
        </div>
      </section>

      {/* Part 3: TUTOR MARKETPLACE PROMINENT SECTION */}
      <section id="marketplace" className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              Tutor Marketplace & Presence
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Let students discover your teaching.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Create a verified public presence so prospective students and parents can find your subjects, credentials, experience, and fee structure without friction.
            </p>
          </div>

          {/* Interactive Mock Tutor Profile Card & The Journey */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Interactive Mock Profile Card (5 Cols) */}
            <div className="lg:col-span-5 bg-[#FAFBEF] p-6 sm:p-7 rounded-3xl border-2 border-slate-200/90 shadow-md space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#318A25] bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  Live Marketplace Card Preview
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#55C832]" />
                  Active Listing
                </span>
              </div>

              {/* Tutor Header Info */}
              <div className="flex items-start gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#172B4D] to-[#318A25] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  RR
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-black text-[#172B4D]">Dr. Rajesh Raman</h3>
                    <ShieldCheck className="h-4 w-4 text-[#55C832]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Senior Mathematics & Physics Specialist
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Bangalore, India • 12+ Years Teaching
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {['Mathematics', 'Physics', 'IIT JEE', 'Grade 9-12'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-bold bg-white text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Bio summary */}
              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-slate-100">
                &ldquo;Focused on first-principles conceptual clarity and problem-solving intuition. Over 400+ students mentored into top universities.&rdquo;
              </p>

              {/* Fees and Connect Action */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Teaching Fee</span>
                  <span className="text-base font-black text-[#172B4D]">
                    ₹800 <span className="text-xs font-medium text-slate-500">/ class</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setHasConnected(!hasConnected)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    hasConnected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'btn-nuzigo-primary shadow-sm'
                  }`}
                >
                  {hasConnected ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Request Sent!</span>
                    </>
                  ) : (
                    <>
                      <span>Connect with Tutor</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* The 6-Step Journey (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#318A25]">
                  How Discovery Works
                </span>
                <h3 className="text-2xl font-black text-[#172B4D] tracking-tight">
                  Your journey from profile to student connection
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  We don&rsquo;t make false promises of overnight student floods. Instead, Nuzigo gives you a high-credibility, professional public showcase that you own and control.
                </p>
              </div>

              {/* 6 Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    step: '1',
                    title: 'Build your profile',
                    desc: 'Share your background, teaching philosophy, and qualifications.',
                  },
                  {
                    step: '2',
                    title: 'Add subjects & grades',
                    desc: 'Define the syllabus, curriculum, and age groups you excel at teaching.',
                  },
                  {
                    step: '3',
                    title: 'Set your teaching fees',
                    desc: 'Publish transparent rates (per class, hour, or month) with clear inclusions.',
                  },
                  {
                    step: '4',
                    title: 'Publish your profile',
                    desc: 'Go live on the public directory with your personalized shareable URL.',
                  },
                  {
                    step: '5',
                    title: 'Students discover you',
                    desc: 'Learners filter by subject and send direct join requests without middlemen.',
                  },
                  {
                    step: '6',
                    title: 'Connect with students',
                    desc: 'Accept requests in one click and immediately enroll them into your batches.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-3.5 rounded-2xl bg-[#FAFBEF] border border-slate-200/80 flex items-start gap-3 hover:border-[#55C832]/60 transition-colors"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#55C832] text-white text-xs font-black">
                      {item.step}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-[#172B4D]">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 font-medium leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 4: TUTOR WORKSPACE */}
      <section id="workspace" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              Teaching Workspace
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Everything you need to manage your teaching.
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Click any tool below to inspect the dedicated workspace modules built into Nuzigo.
            </p>
          </div>

          {/* 8 Interactive Workspace Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WORKSPACE_TOOLS.map((tool) => {
              const Icon = tool.icon
              const isSelected = activeWorkspaceTab === tool.id

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveWorkspaceTab(tool.id as any)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#55C832] shadow-md ring-2 ring-[#55C832]/20'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold ${
                        isSelected ? 'bg-[#55C832] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-black text-sm text-[#172B4D] block">{tool.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-1">
                    {tool.headline}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Interactive Workspace Preview Panel */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#318A25]">
                  {activeTool.previewTag}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#172B4D]">
                  {activeTool.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {activeTool.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {activeTool.previewContent.badge}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#55C832]/15 text-[#318A25] text-xs font-extrabold">
                  {activeTool.previewContent.highlight}
                </span>
              </div>
            </div>

            {/* Mock Item List for the Active Tool */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {activeTool.previewContent.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAFBEF] border border-slate-200/90 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#172B4D] block">{item.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium block">{item.batch}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 self-start">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Part 5: ONLINE CLASSROOM */}
      <section id="classroom" className="py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              Native Classroom Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Teach online without stitching together five different tools.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Eliminate separate Zoom meetings, external whiteboard tabs, and WhatsApp links. Everything runs inside Nuzigo with native audio/video, digital whiteboard, and instant rapid questions.
            </p>
          </div>

          {/* Lightweight Simulated Classroom UI */}
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border-4 border-slate-800 text-white space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Session: Grade 10 Mechanics
                </span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">8 of 8 Students Present</span>
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveView('video')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'video'
                      ? 'bg-[#55C832] text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Video & Grid
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('whiteboard')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'whiteboard'
                      ? 'bg-[#55C832] text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Digital Whiteboard
                </button>
              </div>
            </div>

            {/* Screen Content Area */}
            <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden flex flex-col justify-between p-4 border border-slate-800">
              {activeView === 'video' ? (
                /* Video mode layout */
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Tutor Audio / Video Active</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-md">
                      HD 1080p
                    </span>
                  </div>

                  {/* Simulated interactive live quiz bubble */}
                  <div className="max-w-md mx-auto w-full bg-slate-900/90 backdrop-blur-md border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Live Rapid Question
                      </span>
                      <span className="text-[10px] text-slate-400">12s remaining</span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-white">
                      What is the acceleration due to gravity on Earth?
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      {['9.8 m/s²', '8.9 m/s²', '10.8 m/s²', '9.2 m/s²'].map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedAnswer(i)
                            setQuizState('answered')
                          }}
                          className={`p-2 rounded-xl text-left border transition-all text-[11px] ${
                            selectedAnswer === i
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                              : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </button>
                      ))}
                    </div>

                    {quizState === 'answered' && (
                      <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Instant Response Logged • 100% of batch responded correctly!</span>
                      </p>
                    )}
                  </div>

                  {/* Student row at bottom */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {['Aarav S.', 'Priya N.', 'Rohan M.', 'Kavya T.'].map((student, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1.5 shrink-0"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{student}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Whiteboard mode layout */
                <div className="h-full flex flex-col justify-between bg-white text-slate-900 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <PenTool className="h-4 w-4 text-[#318A25]" />
                      <span>Multi-Page Collaborative Whiteboard (Page 2 of 4)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Sync Active
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center font-mono text-sm sm:text-base text-slate-700 font-bold">
                    <span>F = m × a &nbsp; ➔ &nbsp; a = F / m</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Tools: Pen • Eraser • Shapes • Text • Laser Pointer</span>
                    <span>1-Tap PNG Export Available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold">
                  Microphone: On
                </span>
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold">
                  Camera: HD
                </span>
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold hidden sm:inline">
                  Screen Share: Ready
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHandRaised(!handRaised)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    handRaised
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-200 hover:text-white'
                  }`}
                >
                  <Hand className="h-3.5 w-3.5" />
                  <span>{handRaised ? 'Hand Raised!' : 'Raise Hand'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 6: TUTOR WORKFLOW */}
      <section id="workflow" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              Structured Milestones
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              From your next class to student progress.
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Nuzigo connects every phase of your teaching so no details slip through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                name: 'Prepare',
                title: 'Lesson Notes & Agenda',
                desc: 'Upload reference materials, syllabus topics, and rapid quiz questions before the session starts.',
                icon: Sparkles,
              },
              {
                step: '02',
                name: 'Teach',
                title: 'Live Classroom',
                desc: 'Explain concepts with high-clarity video, multi-page whiteboard, and instant rapid questions.',
                icon: Video,
              },
              {
                step: '03',
                name: 'Assign',
                title: 'Homework & Tasks',
                desc: 'Create assignments linked directly to the lesson topic with firm deadlines and file uploads.',
                icon: BookOpen,
              },
              {
                step: '04',
                name: 'Track',
                title: 'Attendance & Tests',
                desc: 'Log attendance with 1 tap, score tests, and record fee statuses without awkward reminders.',
                icon: ClipboardCheck,
              },
              {
                step: '05',
                name: 'Continue',
                title: 'Study Streaks',
                desc: 'Students maintain weekly study streaks by showing up consistently for their scheduled batches.',
                icon: Flame,
              },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-100 hover:border-[#55C832]/60 transition-all space-y-3 flex flex-col justify-between"
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

      {/* Part 7: TUTOR GAMIFICATION / ENGAGEMENT */}
      <section className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-[#55C832]/30">
              Engagement & Accountability
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Tools that make student participation and consistency engaging.
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              We design gamification as an intentional pedagogical system — not a distracting video game.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#172B4D]">Live In-Class Rapid Questions</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Transform passive listeners into active thinkers. Push quick multiple-choice checks during explanations to verify comprehension without students feeling put on the spot.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#172B4D]">Batch Schedule Streaks</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Streaks are tied to your batch timetable. Showing up to Tuesday and Thursday classes keeps the cohort streak alive, drastically reducing unexcused missed lessons.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#172B4D]">XP, Badges & Milestone Ledger</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Timely homework submissions, test improvements, and attendance earn XP and badges in a transparent ledger, giving students visual pride in their hard work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Part 8: TUTOR PROFILE ONBOARDING PREVIEW */}
      <section id="onboarding" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              Quick Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Set up your Nuzigo presence in a few steps.
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Getting started is quick and flexible. You can set up your public profile now or skip and complete it later from your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {[
              {
                step: 'Step 1',
                title: 'Tutor Profile',
                desc: 'Enter your name, experience, teaching mode, and primary subjects.',
              },
              {
                step: 'Step 2',
                title: 'Marketplace Option',
                desc: 'Choose to create a discovery profile or keep your workspace private.',
              },
              {
                step: 'Step 3',
                title: 'Add Teaching Fees',
                desc: 'Set transparent pricing rate, billing unit (per class/month), and currency.',
              },
              {
                step: 'Step 4',
                title: 'Preview Profile',
                desc: 'Inspect your live student-facing card before publishing.',
              },
              {
                step: 'Step 5',
                title: 'Publish & Launch',
                desc: 'Go live on the marketplace or skip and publish anytime from Settings.',
              },
            ].map((st) => (
              <div
                key={st.step}
                className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#318A25]">
                    {st.step}
                  </span>
                  <h4 className="text-sm font-extrabold text-[#172B4D]">{st.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-xl mx-auto space-y-3 shadow-xs">
            <p className="text-xs text-slate-600 font-medium">
              💡 <strong>Flexible onboarding:</strong> Marketplace setup can be skipped at any step. Your teaching workspace is ready immediately upon signing up.
            </p>
            <div>
              <Link
                href="/signup?role=tutor"
                className="btn-nuzigo-primary text-xs font-bold px-6 py-2.5 inline-flex items-center gap-1.5 shadow-md"
              >
                <span>Start as a Tutor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Part 9: TUTOR-SPECIFIC CTA */}
      <section className="py-20 bg-gradient-to-br from-[#172B4D] via-[#10203a] to-[#0a1424] text-white px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to build your teaching space?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-medium">
            Join educators who manage their students, conduct classes, and grow their presence on Nuzigo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup?role=tutor"
              className="btn-nuzigo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-xl"
            >
              <span>Create Tutor Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tutors"
              className="btn-nuzigo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Search className="h-4 w-4" />
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 text-xs text-slate-500 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} NUZIGO. All rights reserved.</p>
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
