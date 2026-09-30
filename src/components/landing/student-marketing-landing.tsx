'use client'

import React, { useState } from 'react'
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
  HeartHandshake,
  Zap,
  Coins,
  Search,
  Check,
  MessageSquare,
  ShieldCheck,
  Star,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'

interface StudentMarketingLandingProps {
  currentUser?: {
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
}

const MOCK_TUTORS = [
  {
    id: '1',
    name: 'Dr. Rajesh Raman',
    initials: 'RR',
    role: 'Senior Math & Physics Faculty',
    rating: '4.9',
    reviews: '38 reviews',
    subjects: ['Mathematics', 'Physics', 'IIT JEE'],
    experience: '12+ Years',
    mode: 'Online & Hybrid',
    location: 'Bangalore, India',
    fee: '₹800',
    feeUnit: '/ class',
    bio: 'Breaks down tough calculus and kinematics into intuitive, visual proofs.',
  },
  {
    id: '2',
    name: 'Pooja Venkatesh',
    initials: 'PV',
    role: 'Biotechnology & Chemistry Mentor',
    rating: '5.0',
    reviews: '44 reviews',
    subjects: ['Chemistry', 'Biology', 'NEET Prep'],
    experience: '8+ Years',
    mode: 'Live Online Only',
    location: 'Chennai, India',
    fee: '₹750',
    feeUnit: '/ class',
    bio: 'Specialized in organic chemistry reaction mechanisms and cellular biology.',
  },
  {
    id: '3',
    name: 'Marcus Vance',
    initials: 'MV',
    role: 'Advanced Calculus & SAT Specialist',
    rating: '4.9',
    reviews: '29 reviews',
    subjects: ['Calculus BC', 'SAT Math', 'Algebra II'],
    experience: '10+ Years',
    mode: 'Online Worldwide',
    location: 'Remote Global',
    fee: '₹1,200',
    feeUnit: '/ class',
    bio: 'Patient mentor helping high-schoolers master college-level problem solving.',
  },
]

export function StudentMarketingLanding({ currentUser }: StudentMarketingLandingProps) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All')
  const [connectedTutorId, setConnectedTutorId] = useState<string | null>(null)

  // Student Learning Experience journey tab
  const [activeJourneyStep, setActiveJourneyStep] = useState<
    'connect' | 'schedule' | 'attend' | 'practice' | 'track'
  >('attend')

  const filteredTutors =
    selectedSubjectFilter === 'All'
      ? MOCK_TUTORS
      : MOCK_TUTORS.filter((t) =>
          t.subjects.some((s) => s.toLowerCase().includes(selectedSubjectFilter.toLowerCase()))
        )

  const LEARNING_STEPS = [
    {
      id: 'connect',
      stepNum: '01',
      title: 'Connect',
      subtitle: 'Join your tutor’s batch',
      description: 'Explore verified tutors on the marketplace or enter the batch invite code provided by your teacher.',
      previewBadge: 'Direct Request',
      mockData: {
        headline: 'Batch Invitation Code: TP-PHY-10',
        detail: 'Instant enrollment into CBSE Class 10 Physics cohort upon approval.',
        status: 'Request Verified',
      },
    },
    {
      id: 'schedule',
      stepNum: '02',
      title: 'Schedule',
      subtitle: 'Never miss a class',
      description: 'All upcoming sessions appear in your personal calendar with automatic countdowns and start alerts.',
      previewBadge: 'Synchronized Timetable',
      mockData: {
        headline: 'Next: Mechanics Problem Solving',
        detail: 'Tuesday & Thursday • 5:00 PM - 6:00 PM',
        status: 'Starting in 2 hours',
      },
    },
    {
      id: 'attend',
      stepNum: '03',
      title: 'Attend',
      subtitle: 'Interactive live classroom',
      description: 'Join with one click. Participate in whiteboard discussions, see live screen shares, and answer rapid quizzes.',
      previewBadge: 'Live Participation',
      mockData: {
        headline: 'In-Class Rapid Quiz: 4 of 4 Solved',
        detail: 'Answered correctly in 8 seconds • +50 XP Earned',
        status: 'Active in Class',
      },
    },
    {
      id: 'practice',
      stepNum: '04',
      title: 'Practice',
      subtitle: 'Homework & topic tests',
      description: 'Submit your solution notes before deadlines and get personalized feedback and score analysis directly from your tutor.',
      previewBadge: 'Timely Submissions',
      mockData: {
        headline: 'Kinematics Worksheet #3 Submitted',
        detail: 'Score: 48/50 • Tutor feedback: "Excellent force resolution in Q4!"',
        status: 'Reviewed',
      },
    },
    {
      id: 'track',
      stepNum: '05',
      title: 'Track',
      subtitle: 'Streaks, XP & Mastery',
      description: 'Watch your weekly class streak burn bright, earn Gold Coins in your ledger, and build unstoppable academic momentum.',
      previewBadge: 'Verifiable Progress',
      mockData: {
        headline: '4-Week Cohort Attendance Streak 🔥',
        detail: 'Rank #2 on Monthly Batch Board • 850 Total XP',
        status: 'Milestone Unlocked',
      },
    },
  ]

  const activeStepData = LEARNING_STEPS.find((s) => s.id === activeJourneyStep)!

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
                NUZIGO
              </span>
              <span className="text-[10px] font-bold text-[#318A25] tracking-wide">
                For Students & Learners
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#marketplace" className="hover:text-slate-900 transition-colors">
              Find Tutors
            </a>
            <a href="#journey" className="hover:text-slate-900 transition-colors">
              How You Learn
            </a>
            <a href="#habits" className="hover:text-slate-900 transition-colors">
              Study Streaks & XP
            </a>
            <a href="#parents" className="hover:text-slate-900 transition-colors">
              Parent Peace of Mind
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/student"
                className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
              >
                <span>Go to Student Portal</span>
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
                  href="/signup?role=student"
                  className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Part 10: HERO */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-black tracking-wide">
            <GraduationCap className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Engaging Learning For Real Academic Growth</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
            Learn with the tutors{' '}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#256e1d] bg-clip-text text-transparent">
              you choose.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Discover verified educators, attend interactive live classes with digital whiteboards, solve chapter quizzes, submit homework, and build unstoppable study momentum.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup?role=student"
              className="btn-nuzigo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#marketplace"
              className="btn-nuzigo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <Search className="h-4 w-4 text-[#318A25]" />
              <span>Browse Tutor Profiles</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Interactive Live Sessions</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>In-Class Rapid Quizzes</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Batch Schedule Streaks</span>
            </span>
          </div>
        </div>
      </section>

      {/* Part 11: STUDENT MARKETPLACE SECTION */}
      <section id="marketplace" className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              Tutor Discovery
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Find the right tutor for what you want to learn.
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Filter verified tutor profiles, compare experience and transparent fee rates, and send direct connection requests.
            </p>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(subject)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedSubjectFilter === subject
                      ? 'bg-[#172B4D] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Marketplace Tutor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => {
              const isConnected = connectedTutorId === tutor.id

              return (
                <div
                  key={tutor.id}
                  className="bg-[#FAFBEF] rounded-3xl p-6 border-2 border-slate-200/90 shadow-sm hover:border-[#55C832]/60 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#172B4D] to-[#318A25] text-white flex items-center justify-center font-black text-lg shadow-sm">
                          {tutor.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-extrabold text-[#172B4D] text-base">{tutor.name}</h3>
                            <ShieldCheck className="h-3.5 w-3.5 text-[#55C832]" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{tutor.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-black text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{tutor.rating}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {tutor.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      &ldquo;{tutor.bio}&rdquo;
                    </p>

                    {/* Mode & Location */}
                    <div className="text-[11px] text-slate-500 font-medium space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{tutor.experience} • {tutor.mode}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{tutor.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee & Action */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fee Rate</span>
                      <span className="text-base font-black text-[#172B4D]">
                        {tutor.fee} <span className="text-xs font-medium text-slate-500">{tutor.feeUnit}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConnectedTutorId(isConnected ? null : tutor.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isConnected
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'btn-nuzigo-primary shadow-xs'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Request Sent</span>
                        </>
                      ) : (
                        <>
                          <span>Connect</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/tutors"
              className="text-xs font-bold text-[#318A25] hover:text-[#256e1d] inline-flex items-center gap-1 underline underline-offset-4"
            >
              <span>Explore all verified tutors in the public marketplace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Part 12: STUDENT LEARNING EXPERIENCE */}
      <section id="journey" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              The Learning Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Connect ➔ Schedule ➔ Attend ➔ Practice ➔ Track
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Click each step to preview how your student workspace keeps every lesson, quiz, and assignment connected.
            </p>
          </div>

          {/* 5 Interactive Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {LEARNING_STEPS.map((step) => {
              const isSelected = activeJourneyStep === step.id

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveJourneyStep(step.id as any)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#55C832] shadow-md ring-2 ring-[#55C832]/20'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#318A25]/50 block">{step.stepNum}</span>
                    <span className="font-black text-sm text-[#172B4D] block">{step.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-2">
                    {step.subtitle}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Interactive Step Preview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#318A25]">
                  Step {activeStepData.stepNum} • {activeStepData.previewBadge}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#172B4D]">
                  {activeStepData.title}: {activeStepData.subtitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {activeStepData.description}
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-[#55C832]/15 text-[#318A25] text-xs font-extrabold self-start sm:self-center">
                {activeStepData.mockData.status}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFBEF] border border-slate-200/90 space-y-2">
              <span className="text-sm font-black text-[#172B4D] block">
                {activeStepData.mockData.headline}
              </span>
              <p className="text-xs text-slate-600 font-medium">
                {activeStepData.mockData.detail}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification, Streaks & Rewards (Part 10 & 12) */}
      <section id="habits" className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-[#55C832]/30">
              Momentum & Motivation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Turn study habits into unstoppable momentum.
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Show up to your batch classes, answer rapid in-class questions, and watch your weekly streaks grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#172B4D]">Batch Schedule Streaks</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Streaks are tied to your scheduled cohort sessions. Attend all your Tuesday and Thursday classes to keep your study flame alive every week.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#172B4D]">Live In-Class Rapid Quizzes</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Tutors push instant questions to your screen during class. Tap your answer in seconds, see instant explanations, and learn without hesitation.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#172B4D]">XP, Badges & Rewards</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Every completed session, submitted worksheet, and test improvement adds XP to your student profile and records in your tamper-evident ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Transparency Section */}
      <section id="parents" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border-2 border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-2xl shrink-0">
            <HeartHandshake className="h-8 w-8" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-wider text-violet-700">
              For Parents & Guardians
            </span>
            <h3 className="text-2xl font-black text-[#172B4D]">
              Clear, transparent updates without constant checking.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Parents get their own dedicated login to verify class attendance timestamps, reviewed homework marks, test score breakdowns, and fee receipts in real time.
            </p>
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
            Join your tutor’s batch or browse verified educators to start improving today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup?role=student"
              className="btn-nuzigo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-xl"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tutors"
              className="btn-nuzigo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Search className="h-4 w-4" />
              <span>Browse Tutors</span>
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
