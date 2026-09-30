'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Video,
  BookOpen,
  Award,
  Users,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Store,
  Layers,
  Check,
  Eye,
  ChevronRight,
  Play,
  Share2,
  Mic,
  MicOff,
  PenTool,
  Hand,
  Flame,
  Zap,
  Trophy,
  ExternalLink,
  GraduationCap,
  Heart,
  BarChart3,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'

interface MarketingLandingProps {
  currentUser?: {
    email: string
    role?: 'tutor' | 'student' | 'parent' | null
  } | null
  dashboardHref: string
}

// =============================================================================
// HERO INTERACTIVE PHASES DATA
// =============================================================================
type HeroPhase = 'discover' | 'connect' | 'teach' | 'learn' | 'track'

interface HeroPhaseInfo {
  id: HeroPhase
  title: string
  subtitle: string
  pillText: string
  cardBadge: string
  cardTitle: string
  cardSnippet: string
}

const HERO_PHASES: Record<HeroPhase, HeroPhaseInfo> = {
  discover: {
    id: 'discover',
    title: 'Discover Verified Tutors',
    subtitle: 'Search educators by subject, grade level, and teaching mode.',
    pillText: '1. Discover',
    cardBadge: 'Marketplace Directory',
    cardTitle: 'Mathematics & Science Mentors',
    cardSnippet: 'Explore verified educator profiles with transparent schedules and fee information.',
  },
  connect: {
    id: 'connect',
    title: 'Meaningful Connections',
    subtitle: 'Direct enrollment requests and personalized batch matching.',
    pillText: '2. Connect',
    cardBadge: 'Student Connection',
    cardTitle: 'Class 10 CBSE Math Cohort',
    cardSnippet: 'Submit a join request and begin direct communication with your tutor.',
  },
  teach: {
    id: 'teach',
    title: 'Interactive Teaching',
    subtitle: 'Edge-to-edge virtual classroom with whiteboard and rapid polls.',
    pillText: '3. Teach',
    cardBadge: 'Virtual Classroom',
    cardTitle: 'Live Session in Progress',
    cardSnippet: 'Screen sharing, digital whiteboard, real-time quizzes, and instant attendance logging.',
  },
  learn: {
    id: 'learn',
    title: 'Active Student Learning',
    subtitle: 'Targeted homework, practice exams, and clear progress milestones.',
    pillText: '4. Learn',
    cardBadge: 'Student Portal',
    cardTitle: 'Daily Learning Journey',
    cardSnippet: 'Complete assignments, practice tests, and earn Gold Coins for active participation.',
  },
  track: {
    id: 'track',
    title: 'Progress & Consistency',
    subtitle: 'Weekly attendance streaks and transparent parent visibility.',
    pillText: '5. Track',
    cardBadge: 'Progress & Streaks',
    cardTitle: '4-Week Consistency Streak',
    cardSnippet: 'Weekly habit streaks, attendance ledgers, and automated parent updates.',
  },
}

const HERO_PHASE_KEYS: HeroPhase[] = ['discover', 'connect', 'teach', 'learn', 'track']

// =============================================================================
// ROLE SELECTOR DATA
// =============================================================================
type RoleType = 'tutor' | 'student' | 'parent'

interface RoleDetail {
  id: RoleType
  emoji: string
  badge: string
  title: string
  tagline: string
  description: string
  ctaText: string
  ctaHref: string
  highlights: string[]
  previewCardTitle: string
  previewCardSnippet: string
}

const ROLES_DATA: Record<RoleType, RoleDetail> = {
  tutor: {
    id: 'tutor',
    emoji: '🧑‍🏫',
    badge: 'For Independent Tutors',
    title: 'Teach, manage, grow.',
    tagline: 'Your complete teaching workspace and student discovery engine.',
    description:
      'Replace disjointed tools with one cohesive home for scheduling batches, teaching online, tracking attendance, and publishing your marketplace profile.',
    ctaText: 'Start as a Tutor',
    ctaHref: '/for-tutors',
    highlights: [
      'Publish a public tutor profile to let students discover your teaching',
      'Manage online and in-person batches with recurring timetables',
      'Interactive classroom with digital whiteboard and rapid quizzes',
      'Automated attendance tracking and student performance records',
      'Assign homework, administer tests, and grade submissions seamlessly',
    ],
    previewCardTitle: 'Tutor Workspace Dashboard',
    previewCardSnippet: 'All your batches, student join requests, live timetable, and fee ledgers in one clean view.',
  },
  student: {
    id: 'student',
    emoji: '🎓',
    badge: 'For Curious Learners',
    title: 'Discover, learn, progress.',
    tagline: 'Connect with verified tutors and build unstoppable study momentum.',
    description:
      'Join live interactive classes, answer rapid quizzes to earn Gold Coins, follow a structured milestone journey, and build weekly attendance streaks.',
    ctaText: 'Start as a Student',
    ctaHref: '/for-students',
    highlights: [
      'Discover and connect with top tutors in your subject and grade',
      'Enter live online classroom rooms with one click from your schedule',
      'Earn XP and Gold Coins through active in-class participation',
      'Stay on top of upcoming homework, tests, and study materials',
      'Build schedule-based weekly streaks to reinforce consistent learning',
    ],
    previewCardTitle: 'Student Space & Learning Journey',
    previewCardSnippet: 'Your daily timetable, active batch cohort, homework list, and streak tracking.',
  },
  parent: {
    id: 'parent',
    emoji: '👪',
    badge: 'For Engaged Parents',
    title: 'Stay connected with learning.',
    tagline: 'Clear, transparent insight into your child’s educational consistency.',
    description:
      'No more guesswork or texting tutors back and forth. View attendance logs, test score reports, upcoming fees, and class schedules in real time.',
    ctaText: 'Explore Parent Portal',
    ctaHref: '/overview#parent',
    highlights: [
      'Live attendance confirmation whenever your child enters class',
      'Transparent test score ledgers with grades and tutor remarks',
      'Clear fee payment history and upcoming billing receipts',
      'Direct announcements and notifications from verified instructors',
      'Zero intrusion: supports independent learning while keeping you informed',
    ],
    previewCardTitle: 'Parent Portal Insights',
    previewCardSnippet: 'Attendance percentages, graded test trends, and direct batch schedules.',
  },
}

// =============================================================================
// TUTOR WORKFLOW 8 STEPS DATA
// =============================================================================
interface WorkflowStep {
  step: number
  title: string
  tag: string
  description: string
  mockHeading: string
  mockDetails: string[]
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    title: 'Create Your Tutor Profile',
    tag: 'Profile Setup',
    description: 'Establish your credentials, teaching subjects, grade levels, and educational philosophy.',
    mockHeading: 'Dr. Priya Sharma — Mathematics & Physics',
    mockDetails: ['10+ Years Experience', 'CBSE, ICSE & Olympiads', 'Verified Nuzigo Educator Badge'],
  },
  {
    step: 2,
    title: 'Create Batches',
    tag: 'Batch Cohorts',
    description: 'Set up online, offline, or hybrid batches with defined capacities and target curricula.',
    mockHeading: 'Class 10 CBSE Math Cohort A',
    mockDetails: ['Mon, Wed, Fri • 5:00 PM – 6:30 PM', '12 Enrolled Students', 'Curriculum: NCERT + Exemplar'],
  },
  {
    step: 3,
    title: 'Add Students',
    tag: 'Enrollment',
    description: 'Accept student marketplace connection requests or share batch invite codes directly.',
    mockHeading: 'Student Roster & Verification',
    mockDetails: ['One-click request approval', 'Direct student email & grade linking', 'Automated parent portal sync'],
  },
  {
    step: 4,
    title: 'Schedule Classes',
    tag: 'Calendar & Timetable',
    description: 'Generate weekly recurring schedules and specific topic dates on your live teaching calendar.',
    mockHeading: 'Quadratic Equations & Graphs',
    mockDetails: ['Scheduled for Today at 5:00 PM', 'Live link generated automatically', 'Synced to student dashboard'],
  },
  {
    step: 5,
    title: 'Prepare Your Classroom',
    tag: 'Pre-Class Prep',
    description: 'Review digital whiteboard canvases, draft interactive rapid polls, and prepare lesson notes.',
    mockHeading: 'Classroom Preparation Hub',
    mockDetails: ['3 Pre-drawn whiteboard diagrams', '2 Fast Answer quiz questions queued', 'Downloadable notes uploaded'],
  },
  {
    step: 6,
    title: 'Teach Live',
    tag: 'Online Classroom',
    description: 'Host edge-to-edge virtual sessions with high-definition audio, video, whiteboard, and screen sharing.',
    mockHeading: 'Live WebRTC Teaching Stage',
    mockDetails: ['Full video grid & screen share', 'Digital Whiteboard with pen tools', 'Instant student hand-raising alert'],
  },
  {
    step: 7,
    title: 'Assign Learning Activities',
    tag: 'Homework & Quizzes',
    description: 'Give homework tasks with submission deadlines and conduct graded class assessments.',
    mockHeading: 'Practice Assignment #4: Polynomials',
    mockDetails: ['Due in 3 days', 'Grading rubric configured', 'Instant XP award upon review'],
  },
  {
    step: 8,
    title: 'Track Progress',
    tag: 'Analytics & Ledgers',
    description: 'Monitor individual student attendance, test score improvements, and weekly habit streaks.',
    mockHeading: 'Performance & Attendance Ledger',
    mockDetails: ['96% Average Batch Attendance', 'Class test average: 88.5%', 'Weekly streak retention: 100%'],
  },
]

// =============================================================================
// PRODUCT TOUR TABS DATA
// =============================================================================
type TourTab = 'marketplace' | 'workspace' | 'classroom' | 'student' | 'progress' | 'rewards'

interface TourTabInfo {
  id: TourTab
  label: string
  headline: string
  subhead: string
  features: string[]
  visualBadge: string
  mockStats: Array<{ label: string; value: string }>
}

const TOUR_TABS: Record<TourTab, TourTabInfo> = {
  marketplace: {
    id: 'marketplace',
    label: 'Marketplace',
    headline: 'Public Tutor Discovery Directory',
    subhead: 'A clean, verified place for prospective students and parents to find your teaching.',
    features: [
      'Individual profile URL and custom slug',
      'Filter by subject, grade level, and language',
      'Transparent fee and schedule information',
      'Student join requests sent to your approval queue',
    ],
    visualBadge: 'Student Discovery Engine',
    mockStats: [
      { label: 'Verified Profiles', value: '100% Authentic' },
      { label: 'Direct Requests', value: 'Zero Middlemen' },
    ],
  },
  workspace: {
    id: 'workspace',
    label: 'Tutor Workspace',
    headline: 'Unified Educator Operational Hub',
    subhead: 'Everything you need to organize your classes without jumping between multiple apps.',
    features: [
      'Batch rosters and student directories',
      'Recurring schedule generation and timetable calendar',
      'Fee charge ledgers and offline payment tracking',
      'Student and parent communication logs',
    ],
    visualBadge: 'Educator Command Center',
    mockStats: [
      { label: 'Apps Replaced', value: '5 into 1' },
      { label: 'Setup Time', value: '< 2 Minutes' },
    ],
  },
  classroom: {
    id: 'classroom',
    label: 'Online Classroom',
    headline: 'Interactive Edge-to-Edge Virtual Room',
    subhead: 'Purpose-built for active education, not generic corporate video meetings.',
    features: [
      'Multi-peer WebRTC mesh audio and video',
      'Integrated digital whiteboard with multi-page support',
      'Rapid-fire quiz questions and live polling',
      'Automated attendance logging on session join',
    ],
    visualBadge: 'Interactive Learning Stage',
    mockStats: [
      { label: 'Classroom Mode', value: 'Fullscreen' },
      { label: 'Latency', value: 'Real-time WebRTC' },
    ],
  },
  student: {
    id: 'student',
    label: 'Student Space',
    headline: 'Engaging Student Learning Portal',
    subhead: 'A distraction-free space for students to attend classes and master their subjects.',
    features: [
      'Direct one-click classroom entry',
      'Today’s learning feed with upcoming tasks',
      'Interactive homework and test submissions',
      'Milestone progression path with level tracking',
    ],
    visualBadge: 'Student Learning Space',
    mockStats: [
      { label: 'Class Entry', value: 'Instant' },
      { label: 'Level Path', value: 'Adaptive' },
    ],
  },
  progress: {
    id: 'progress',
    label: 'Progress & Attendance',
    headline: 'Transparent Educational Analytics',
    subhead: 'Clear visibility for tutors, students, and parents into attendance and grade trends.',
    features: [
      'Session-by-session attendance logs',
      'Graded test scores and percentage calculations',
      'Parent portal with real-time notifications',
      'Automated performance records and report generation',
    ],
    visualBadge: 'Analytics & Ledgers',
    mockStats: [
      { label: 'Attendance Sync', value: 'Instant' },
      { label: 'Parent Access', value: 'Dedicated Portal' },
    ],
  },
  rewards: {
    id: 'rewards',
    label: 'Rewards & Streaks',
    headline: 'Behavioral Engagement & Habit Streaks',
    subhead: 'Educational rewards that celebrate consistency rather than frivolous distractions.',
    features: [
      'Schedule-based weekly streak counters',
      'XP rewards for homework and quiz participation',
      'Gold Coins ledger awarded by tutor interaction',
      'Achievement badges for subject mastery and consistency',
    ],
    visualBadge: 'Gamified Learning Engine',
    mockStats: [
      { label: 'Weekly Streaks', value: 'Habit-Building' },
      { label: 'Incentive Ledger', value: 'Transparent' },
    ],
  },
}

export function MarketingLanding({ currentUser, dashboardHref }: MarketingLandingProps) {
  // Hero auto-cycling
  const [activeHeroPhase, setActiveHeroPhase] = useState<HeroPhase>('discover')
  const [isHeroPaused, setIsHeroPaused] = useState(false)

  // Role selector state
  const [selectedRole, setSelectedRole] = useState<RoleType>('tutor')

  // Tutor workflow step state
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1)

  // Product tour tab state
  const [activeTourTab, setActiveTourTab] = useState<TourTab>('marketplace')

  // Simulated classroom interactions
  const [simulatedWhiteboardActive, setSimulatedWhiteboardActive] = useState(false)
  const [simulatedQuizAnswered, setSimulatedQuizAnswered] = useState<number | null>(null)
  const [simulatedHandRaised, setSimulatedHandRaised] = useState(false)

  // Auto-cycle hero phases every 4.5 seconds unless paused
  useEffect(() => {
    if (isHeroPaused) return
    const timer = setInterval(() => {
      setActiveHeroPhase((curr) => {
        const nextIdx = (HERO_PHASE_KEYS.indexOf(curr) + 1) % HERO_PHASE_KEYS.length
        return HERO_PHASE_KEYS[nextIdx]
      })
    }, 4500)
    return () => clearInterval(timer)
  }, [isHeroPaused])

  const heroPhase = HERO_PHASES[activeHeroPhase]
  const currentRole = ROLES_DATA[selectedRole]
  const currentWorkflow = WORKFLOW_STEPS[activeWorkflowStep - 1]
  const currentTour = TOUR_TABS[activeTourTab]

  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white flex flex-col font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP NAVIGATION HEADER                                              */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] p-1.5 text-white shadow-md shadow-[#55C832]/30">
              <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
            </div>
            <span className="text-xl font-black text-[#172B4D] tracking-tight">NUZIGO</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link href="/tutors" className="hover:text-[#318A25] transition-colors">
              Marketplace
            </Link>
            <Link href="/for-tutors" className="hover:text-[#318A25] transition-colors">
              For Tutors
            </Link>
            <Link href="/for-students" className="hover:text-[#318A25] transition-colors">
              For Students
            </Link>
            <Link href="/overview" className="hover:text-[#318A25] transition-colors">
              Ecosystem
            </Link>
          </nav>

          {/* User Auth CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <Link
                href={dashboardHref}
                className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-2xs"
                >
                  Log In
                </Link>
                <Link
                  href="/onboarding/role"
                  className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. INTERACTIVE HERO SECTION                                           */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Hero Narrative */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-extrabold tracking-wide">
                <Sparkles className="h-3.5 w-3.5 text-[#55C832]" />
                <span>The Modern Tutoring Ecosystem</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
                Everything you need to <span className="text-[#318A25]">teach</span>, learn, and grow.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Nuzigo unites professional tutor discovery, virtual classrooms, batch scheduling, homework, tests,
                attendance, and learning engagement into one cohesive platform.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/onboarding/role">
                  <Button className="w-full sm:w-auto bg-[#55C832] hover:bg-[#318A25] text-white font-black px-7 h-12 rounded-2xl text-sm shadow-md shadow-[#55C832]/25 flex items-center gap-2">
                    <span>Get Started Free</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <a href="#explore">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-bold px-6 h-12 rounded-2xl text-sm shadow-2xs"
                  >
                    Explore Nuzigo
                  </Button>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#55C832]" />
                  Verified Tutors
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#55C832]" />
                  Interactive Classroom
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#55C832]" />
                  Transparent Parent Sync
                </span>
              </div>
            </div>

            {/* Right Interactive Product Preview */}
            <div
              className="lg:col-span-6 relative"
              onMouseEnter={() => setIsHeroPaused(true)}
              onMouseLeave={() => setIsHeroPaused(false)}
            >
              {/* Cycling Phase Pills */}
              <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-3 overflow-x-auto pb-1">
                {HERO_PHASE_KEYS.map((key) => {
                  const p = HERO_PHASES[key]
                  const isActive = activeHeroPhase === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveHeroPhase(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#172B4D] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.pillText}
                    </button>
                  )
                })}
              </div>

              {/* Dynamic Hero Mockup Card */}
              <div className="relative rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-slate-200/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-400 ml-2">Nuzigo Ecosystem</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#55C832]/15 text-[#318A25] border border-[#55C832]/30">
                    {heroPhase.cardBadge}
                  </span>
                </div>

                {/* Simulated Phase Content */}
                <div className="space-y-3 min-h-[220px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#172B4D]">{heroPhase.cardTitle}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{heroPhase.cardSnippet}</p>
                  </div>

                  {/* Interactive Visual Sandbox */}
                  <div className="rounded-2xl border border-slate-100 bg-[#FAFBEF]/70 p-4 space-y-2.5">
                    {activeHeroPhase === 'discover' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#172B4D]">Kishore Kumar — Senior Mathematics</span>
                          <span className="font-black text-[#318A25]">₹1,500 / mo</span>
                        </div>
                        <p className="text-[11px] text-slate-500">CBSE Class 10 & 12 • Online & Hybrid • 8+ Yrs Exp</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200">Math</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200">Calculus</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#55C832] text-white ml-auto">Request to Join</span>
                        </div>
                      </div>
                    )}

                    {activeHeroPhase === 'connect' && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </span>
                          <span className="font-bold text-[#172B4D]">Student Join Request Approved</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Enrolled into: <strong>Class 10 CBSE Math Cohort A</strong></p>
                        <div className="p-2 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-600">
                          Automated calendar invite and parent connection notification dispatched.
                        </div>
                      </div>
                    )}

                    {activeHeroPhase === 'teach' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                            Live Class Active
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">12 Students Connected</span>
                        </div>
                        <div className="h-20 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs gap-2 font-medium">
                          <Video className="h-4 w-4 text-[#55C832]" />
                          <span>Classroom WebRTC Stream & Digital Whiteboard Stage</span>
                        </div>
                      </div>
                    )}

                    {activeHeroPhase === 'learn' && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#172B4D]">Today&apos;s Interactive Mission</span>
                          <span className="font-bold text-[#318A25]">+50 XP • 🪙 10 Gold Coins</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200">
                          <BookOpen className="h-4 w-4 text-[#318A25] shrink-0" />
                          <span className="text-[11px] text-slate-700 font-medium">Practice Set #3: Quadratic Equations</span>
                        </div>
                      </div>
                    )}

                    {activeHeroPhase === 'track' && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-bold text-orange-600">
                            <Flame className="h-4 w-4 fill-current" />
                            4-Week Schedule Streak
                          </span>
                          <span className="font-bold text-[#318A25]">100% Attendance</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#55C832] h-full w-[90%]" />
                        </div>
                        <p className="text-[10px] text-slate-500">Consistent weekly learning habit maintained.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>{isHeroPaused ? 'Hover paused' : 'Auto-cycling preview'}</span>
                    <span className="font-semibold text-[#318A25]">Step {HERO_PHASE_KEYS.indexOf(activeHeroPhase) + 1} of 5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. INTERACTIVE ROLE EXPERIENCE ("What brings you to Nuzigo?")          */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#318A25] bg-[#55C832]/10 px-3 py-1 rounded-full border border-[#55C832]/20">
              Tailored For You
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              What brings you to Nuzigo?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Select your role to explore how Nuzigo transforms your specific educational workflow.
            </p>
          </div>

          {/* 3 Interactive Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['tutor', 'student', 'parent'] as const).map((r) => {
              const role = ROLES_DATA[r]
              const isSelected = selectedRole === r

              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`p-6 rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer select-none space-y-3 ${
                    isSelected
                      ? 'border-[#55C832] bg-[#FAFBEF] shadow-lg shadow-[#55C832]/15 scale-[1.02] ring-2 ring-[#55C832]/25'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{role.emoji}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#55C832] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {role.id}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#172B4D]">{role.title}</h3>
                    <p className="text-xs font-semibold text-[#318A25] mt-0.5">{role.tagline}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{role.description}</p>
                </button>
              )
            })}
          </div>

          {/* Dynamically Swapped Showcase Panel for Selected Role */}
          <div className="rounded-3xl border-2 border-slate-200/90 bg-[#FAFBEF] p-6 sm:p-10 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Feature Highlights */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-extrabold text-[#318A25] uppercase tracking-wider">
                    {currentRole.badge}
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black text-[#172B4D] mt-1">
                    {currentRole.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    {currentRole.tagline}
                  </p>
                </div>

                <ul className="space-y-3">
                  {currentRole.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#55C832] text-white text-[11px] font-bold mt-0.5">
                        ✓
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link href={currentRole.ctaHref}>
                    <Button className="bg-[#55C832] hover:bg-[#318A25] text-white font-black px-6 h-11 rounded-xl text-xs flex items-center gap-2 shadow-xs">
                      <span>{currentRole.ctaText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Dynamic Preview Mockup */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-[#172B4D]">{currentRole.previewCardTitle}</span>
                    <span className="text-[10px] font-bold text-[#318A25] bg-[#55C832]/15 px-2 py-0.5 rounded-full">
                      Live Preview
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{currentRole.previewCardSnippet}</p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Access Mode:</span>
                      <span className="font-bold text-[#172B4D] capitalize">{selectedRole} Experience</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security & Privacy:</span>
                      <span className="font-semibold text-emerald-600">Enterprise Encrypted</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Setup Requirement:</span>
                      <span className="font-semibold text-slate-700">Zero App Installs Required</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. MARKETPLACE MARKETING SECTION                                      */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-[#FAFBEF] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#55C832]/15 text-[#318A25] text-xs font-black">
              <Store className="h-3.5 w-3.5" />
              <span>Nuzigo Tutor Marketplace</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Turn your teaching into a profile students can discover.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Give prospective students and parents a place to discover your teaching, credentials, and fee structure.
            </p>
          </div>

          {/* 4-Step Discovery Flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { num: '01', title: 'Build Your Profile', desc: 'Add subjects, experience, and fee details.' },
              { num: '02', title: 'Get Discovered', desc: 'Appear in filtered marketplace searches.' },
              { num: '03', title: 'Connect with Students', desc: 'Receive and approve direct join requests.' },
              { num: '04', title: 'Start Teaching', desc: 'Welcome students directly into your batches.' },
            ].map((st) => (
              <div key={st.num} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                <span className="text-xs font-black text-[#318A25] bg-[#55C832]/10 px-2 py-0.5 rounded-full">
                  Step {st.num}
                </span>
                <h4 className="text-sm font-bold text-[#172B4D]">{st.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">{st.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Tutor Card Showcase */}
          <div className="max-w-3xl mx-auto rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#172B4D] to-[#318A25] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                  KS
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-[#172B4D]">Kishore Kumar</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#55C832]/15 text-[#318A25] border border-[#55C832]/30">
                      <Shield className="h-3 w-3" /> Verified Educator
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Senior Mathematics Educator • Olympiad & Board Mentor
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    8+ Years Experience • Indiranagar, Bengaluru & Online
                  </p>
                </div>
              </div>

              {/* Fee Information Box */}
              <div className="bg-[#FAFBEF] border border-[#55C832]/30 px-4 py-2 rounded-2xl text-right shrink-0">
                <div className="text-base font-black text-[#318A25]">₹1,500</div>
                <div className="text-[10px] font-semibold text-slate-500">per month / cohort</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Mathematics</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Calculus</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Class 9-10 & 11-12</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  Online Classroom & Offline Batches
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                &ldquo;Unique teaching methodology combining interactive digital whiteboard problem solving with constant live quizzes, doubts resolution, and structured parent progress updates.&rdquo;
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Want a profile like this? Create yours in 3 minutes during onboarding.
              </span>
              <Link href="/onboarding/role">
                <Button className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold px-5 h-10 rounded-xl text-xs flex items-center gap-1.5 shadow-xs">
                  <span>Create Tutor Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. TUTOR WORKFLOW MARKETING ("From preparation to progress")          */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#318A25] bg-[#55C832]/10 px-3 py-1 rounded-full border border-[#55C832]/20">
              Structured Teaching Loop
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              From preparation to progress.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Click through the 8 essential phases that empower independent tutors to run organized, premium classes.
            </p>
          </div>

          {/* 8 Clickable Milestone Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {WORKFLOW_STEPS.map((wf) => {
              const isActive = activeWorkflowStep === wf.step

              return (
                <button
                  key={wf.step}
                  type="button"
                  onClick={() => setActiveWorkflowStep(wf.step)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#55C832] bg-[#FAFBEF] text-[#318A25] shadow-xs ring-1 ring-[#55C832]/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase opacity-70">Step {wf.step}</div>
                  <div className="text-xs font-bold mt-1 line-clamp-2 leading-tight">{wf.title}</div>
                </button>
              )
            })}
          </div>

          {/* Active Step Details Panel */}
          <div className="max-w-4xl mx-auto rounded-3xl border-2 border-slate-200 bg-[#FAFBEF] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
              <div>
                <span className="text-xs font-black text-[#318A25] uppercase tracking-wider">
                  Phase {currentWorkflow.step} • {currentWorkflow.tag}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#172B4D] mt-0.5">
                  {currentWorkflow.title}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#55C832] text-white self-start sm:self-center">
                Step {currentWorkflow.step} of 8
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {currentWorkflow.description}
            </p>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-[#172B4D] uppercase tracking-wide">
                {currentWorkflow.mockHeading}
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentWorkflow.mockDetails.map((det, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="h-2 w-2 rounded-full bg-[#55C832] shrink-0" />
                    <span>{det}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. ONLINE CLASSROOM MARKETING (SIMULATED UI)                          */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#55C832] bg-[#55C832]/15 px-3 py-1 rounded-full border border-[#55C832]/30">
              Edge-to-Edge Virtual Room
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              The classroom built specifically for learning.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Unlike generic meeting tools, Nuzigo includes real-time whiteboards, instant quiz bursts, and automated attendance logging.
            </p>
          </div>

          {/* Interactive Simulated Classroom Box */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl space-y-0">
            {/* Top Toolbar */}
            <div className="h-14 border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-white">Live: Class 10 CBSE Math Cohort</span>
                <span className="hidden sm:inline text-[11px] text-slate-400">| Session #12</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedWhiteboardActive(!simulatedWhiteboardActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    simulatedWhiteboardActive
                      ? 'bg-[#55C832] text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <PenTool className="h-3.5 w-3.5 inline mr-1" />
                  Whiteboard
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedHandRaised(!simulatedHandRaised)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    simulatedHandRaised
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  ✋ {simulatedHandRaised ? 'Hand Raised' : 'Raise Hand'}
                </button>
              </div>
            </div>

            {/* Stage Body */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[340px]">
              {/* Left Stage */}
              <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {simulatedWhiteboardActive ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl p-8 text-center space-y-2">
                    <PenTool className="h-8 w-8 text-[#55C832]" />
                    <p className="text-xs font-bold text-white">Digital Whiteboard Active</p>
                    <p className="text-[11px] text-slate-400">Quadratic parabola axes and root annotations visible to all students.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 text-center">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-[#55C832] mb-2">
                        TUTOR
                      </div>
                      <span className="text-xs font-bold text-slate-200">Dr. Priya Sharma</span>
                      <span className="text-[10px] text-emerald-400">Microphone Active</span>
                    </div>

                    <div className="rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 text-center">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 mb-2">
                        STUDENT
                      </div>
                      <span className="text-xs font-bold text-slate-200">Aarav Patel</span>
                      <span className="text-[10px] text-slate-500">Muted • Screen Active</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                  <span>WebRTC Peer Mesh Active</span>
                  <span>Auto-attendance recorded at 5:02 PM</span>
                </div>
              </div>

              {/* Right Side: Interactive Live Quiz Bursts */}
              <div className="lg:col-span-4 rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#55C832] flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" /> Rapid Quiz Burst
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      +10 Gold Coins
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white">
                    What is the discriminant of 2x² - 4x + 2 = 0?
                  </p>

                  <div className="space-y-2">
                    {[
                      { idx: 0, text: 'A) 0 (Roots are real and equal)', correct: true },
                      { idx: 1, text: 'B) 16', correct: false },
                      { idx: 2, text: 'C) -8', correct: false },
                    ].map((opt) => {
                      const isSelected = simulatedQuizAnswered === opt.idx
                      return (
                        <button
                          key={opt.idx}
                          type="button"
                          onClick={() => setSimulatedQuizAnswered(opt.idx)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? opt.correct
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500 text-rose-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt.text}
                          {isSelected && (
                            <span className="float-right font-bold">
                              {opt.correct ? '✓ Correct!' : '✗ Try again'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 text-center">
                  Try clicking an option above to test live quiz engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. GAMIFIED LEARNING SECTION                                          */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#318A25] bg-[#55C832]/10 px-3 py-1 rounded-full border border-[#55C832]/20">
              Habit-Building Engagement
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              The science of learning momentum.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              We don&apos;t use frivolous games or distractions. Nuzigo connects real educational participation directly with tangible progress indicators.
            </p>
          </div>

          {/* Visual Progression Loop */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {[
              { icon: '📅', step: 'CLASS', desc: 'Attend on schedule' },
              { icon: '✋', step: 'PARTICIPATE', desc: 'Answer questions' },
              { icon: '📝', step: 'COMPLETE', desc: 'Submit homework' },
              { icon: '⚡', step: 'EARN XP', desc: 'Level up scholar status' },
              { icon: '🔥', step: 'BUILD STREAK', desc: 'Weekly habit formation' },
              { icon: '📈', step: 'TRACK PROGRESS', desc: 'Transparent retention' },
            ].map((node, i) => (
              <div key={node.step} className="p-4 rounded-2xl bg-[#FAFBEF] border border-[#55C832]/20 space-y-1.5 shadow-2xs">
                <span className="text-2xl">{node.icon}</span>
                <h4 className="text-xs font-black text-[#172B4D]">{node.step}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{node.desc}</p>
              </div>
            ))}
          </div>

          {/* 3 Core Mechanisms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-lg">
                🔥
              </div>
              <h3 className="text-base font-black text-[#172B4D]">Schedule-Based Streaks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than punishing students for taking scheduled rest days, Nuzigo evaluates streak consistency based on each batch’s actual weekly schedule.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                🪙
              </div>
              <h3 className="text-base font-black text-[#172B4D]">Gold Coins Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tutors award Gold Coins for punctual classroom arrival, insightful question answers, and exemplary homework submissions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                🏆
              </div>
              <h3 className="text-base font-black text-[#172B4D]">Mastery Badges</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Earn permanent achievement badges such as Early Scholar, Rapid Answerer, and Quiz Champion as students reach genuine academic milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. INTERACTIVE PRODUCT TOUR ("Explore Nuzigo")                        */}
      {/* ===================================================================== */}
      <section id="explore" className="py-16 sm:py-24 bg-[#FAFBEF] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#318A25] bg-[#55C832]/10 px-3 py-1 rounded-full border border-[#55C832]/20">
              Interactive Product Tour
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172B4D] tracking-tight">
              Explore Nuzigo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Explore the dedicated pillars that replace fragmented tools with one cohesive workspace.
            </p>
          </div>

          {/* Tour Tabs Bar */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {(['marketplace', 'workspace', 'classroom', 'student', 'progress', 'rewards'] as const).map((t) => {
              const tab = TOUR_TABS[t]
              const isActive = activeTourTab === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTourTab(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#172B4D] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tour Active Card View */}
          <div className="max-w-5xl mx-auto rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-10 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#55C832]/10 px-3 py-1 rounded-full">
                  {currentTour.visualBadge}
                </span>
                <h3 className="text-xl sm:text-3xl font-black text-[#172B4D]">
                  {currentTour.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {currentTour.subhead}
                </p>

                <ul className="space-y-2.5">
                  {currentTour.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <Check className="h-4 w-4 text-[#55C832] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-4">
                <h4 className="text-xs font-black text-[#172B4D] uppercase tracking-wide">
                  Key Metrics & Capabilities
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentTour.mockStats.map((st, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-100 text-center">
                      <div className="text-sm font-black text-[#318A25]">{st.value}</div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{st.label}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-[#FAFBEF] border border-[#55C832]/25 text-[11px] text-[#318A25] font-medium text-center">
                  Integrated directly into your Nuzigo workspace
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. HONEST PRODUCT ECOSYSTEM (NO FAKE METRICS)                         */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#172B4D]">
              Why educators choose Nuzigo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Teaching shouldn&apos;t require juggling five different apps just to run one class session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-[#FAFBEF] border border-[#55C832]/25 space-y-2">
              <h3 className="text-sm font-bold text-[#172B4D]">Zero Tool Fragmentation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No more sending meeting links on WhatsApp, keeping attendance on Excel, and sharing worksheets via email.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFBEF] border border-[#55C832]/25 space-y-2">
              <h3 className="text-sm font-bold text-[#172B4D]">Privacy-First By Default</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tutors retain full control over whether their profile is public or strictly private to existing cohorts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFBEF] border border-[#55C832]/25 space-y-2">
              <h3 className="text-sm font-bold text-[#172B4D]">Effortless Parent Trust</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parents get a dedicated portal showing verified attendance logs and test progress automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 10. HIGH-CONVERTING BOTTOM CTA                                       */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 bg-gradient-to-tr from-[#172B4D] via-[#10203a] to-[#172B4D] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#55C832]/20 border border-[#55C832]/40 text-[#55C832] text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Join the Nuzigo Community</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Your teaching journey starts here.
          </h2>

          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Whether you are an independent educator building a teaching practice or a student seeking structured learning guidance, Nuzigo is ready for you.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/onboarding/tutor">
              <Button className="w-full sm:w-auto bg-[#55C832] hover:bg-[#318A25] text-white font-black px-7 h-12 rounded-2xl text-xs sm:text-sm shadow-lg shadow-[#55C832]/30 flex items-center gap-2">
                <span>Start as a Tutor</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/onboarding/student">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-white/25 bg-white/10 hover:bg-white/20 text-white font-bold px-7 h-12 rounded-2xl text-xs sm:text-sm backdrop-blur-xs"
              >
                <span>Start as a Student</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 11. FOOTER                                                            */}
      {/* ===================================================================== */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-[#55C832] p-1 text-white">
                <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
              </div>
              <span className="font-black text-[#172B4D] tracking-tight">NUZIGO</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The modern connected education ecosystem for independent tutors, curious students, and engaged parents.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#172B4D] uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/tutors" className="hover:text-slate-900">Tutor Marketplace</Link></li>
              <li><Link href="/for-tutors" className="hover:text-slate-900">For Tutors</Link></li>
              <li><Link href="/for-students" className="hover:text-slate-900">For Students</Link></li>
              <li><Link href="/overview" className="hover:text-slate-900">Ecosystem Overview</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#172B4D] uppercase tracking-wider text-[11px]">Features</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/overview#classroom" className="hover:text-slate-900">Online Classroom</Link></li>
              <li><Link href="/overview#streaks" className="hover:text-slate-900">Schedule Streaks</Link></li>
              <li><Link href="/overview#quizzes" className="hover:text-slate-900">Fast Answer Engine</Link></li>
              <li><Link href="/overview#parent" className="hover:text-slate-900">Parent Portal</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#172B4D] uppercase tracking-wider text-[11px]">Account</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/login" className="hover:text-slate-900">Log In</Link></li>
              <li><Link href="/signup" className="hover:text-slate-900">Sign Up</Link></li>
              <li><Link href="/onboarding/role" className="hover:text-slate-900">Select Role</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} Nuzigo. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Learning, teaching, and growing together</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
