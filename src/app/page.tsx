import React from 'react'
import Link from 'next/link'
import {
  Search,
  Sparkles,
  Video,
  Users,
  ClipboardCheck,
  Award,
  BookOpen,
  CreditCard,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Compass,
  Star,
  Monitor,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react'
import type { Metadata } from 'next'
import { getPublicTutors, type PublicTutorSummary } from '@/lib/marketplace'

export const metadata: Metadata = {
  title: 'Nuzilo — Find Top Tutors & Learn Better',
  description:
    'Discover verified independent tutors, explore structured batch offerings, attend live online classrooms, and track your learning progress with Nuzilo.',
}

export const dynamic = 'force-dynamic'

const POPULAR_SUBJECTS = [
  { name: 'Mathematics', icon: '📐', count: 'Calculus, Algebra, Geometry' },
  { name: 'Physics', icon: '⚡', count: 'Mechanics, Electromagnetism, Optics' },
  { name: 'Chemistry', icon: '🧪', count: 'Organic, Inorganic, Physical' },
  { name: 'Biology', icon: '🧬', count: 'Botany, Zoology, Genetics' },
  { name: 'Computer Science', icon: '💻', count: 'Python, Web Dev, Data Structures' },
  { name: 'English & Languages', icon: '📚', count: 'Grammar, Literature, IELTS' },
  { name: 'Economics & Commerce', icon: '📊', count: 'Micro, Macro, Accountancy' },
  { name: 'Foundations (Grades 6–10)', icon: '🌱', count: 'CBSE, ICSE, State Boards' },
]

const FEATURED_TUTOR_FALLBACKS = [
  {
    id: 'f1',
    name: 'Dr. Priya Raman',
    headline: 'CBSE & JEE Advanced Physics Specialist',
    subjects: ['Physics', 'Advanced Mechanics'],
    experience: '10+ yrs',
    mode: 'both',
    rating: '4.9',
    slug: 'priya-raman',
    location: 'Chennai, TN',
  },
  {
    id: 'f2',
    name: 'Arun K. Venkat',
    headline: 'High School Calculus & Pure Mathematics Mentor',
    subjects: ['Mathematics', 'Calculus', 'Algebra'],
    experience: '8 yrs',
    mode: 'online',
    rating: '5.0',
    slug: 'arun-venkat',
    location: 'Bengaluru, KA',
  },
  {
    id: 'f3',
    name: 'Sarah Jenkins',
    headline: 'IELTS Certified English Literature & Speech Trainer',
    subjects: ['English', 'Literature', 'Public Speaking'],
    experience: '6 yrs',
    mode: 'online',
    rating: '4.95',
    slug: 'sarah-jenkins',
    location: 'Kochi, KL',
  },
]

export default async function LandingPage() {
  let publicTutors: PublicTutorSummary[] = []
  try {
    const res = await getPublicTutors({}, 1, 3)
    if (res.tutors && res.tutors.length > 0) {
      publicTutors = res.tutors
    }
  } catch {
    publicTutors = []
  }

  const tutorsToDisplay = publicTutors.length > 0
    ? publicTutors.map((t) => ({
        id: t.id,
        name: t.fullName || 'Tutor',
        headline: t.headline || 'Dedicated Educator on Nuzilo',
        subjects: (t.primarySubjects || []).slice(0, 3),
        experience: t.experienceYears ? `${t.experienceYears} yrs` : 'Experienced',
        mode: t.teachingMode || 'online',
        rating: '5.0',
        slug: t.profileSlug || t.id,
        location: t.locationRegion || 'Online',
      }))
    : FEATURED_TUTOR_FALLBACKS

  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] selection:bg-[#55C832] selection:text-white relative font-sans">
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] text-white font-black text-xl shadow-md shadow-[#55C832]/30">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#172B4D] tracking-tight leading-none">
                Nuzilo
              </span>
              <span className="text-[10px] font-bold text-[#318A25] tracking-wide">
                Learn • Practice • Grow
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link href="/tutors" className="text-[#318A25] hover:text-[#55C832] transition-colors flex items-center gap-1.5 font-extrabold">
              <Compass className="h-4 w-4" />
              <span>Find Tutors</span>
            </Link>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it Works
            </a>
            <a href="#classroom" className="hover:text-slate-900 transition-colors">
              Classroom
            </a>
            <a href="#ecosystem" className="hover:text-slate-900 transition-colors">
              Learning Ecosystem
            </a>
            <Link href="/signup?role=tutor" className="text-slate-700 hover:text-slate-900 transition-colors">
              Teach on Nuzilo
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

      {/* 2. HERO SECTION */}
      <section className="relative pt-14 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-extrabold tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Student-First Education Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.1]">
            Find the right tutor.{' '}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#256e1d] bg-clip-text text-transparent">
              Learn better. Grow faster.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Discover verified tutors, explore subjects, book classes, and learn through an interactive online learning experience with Nuzilo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/tutors"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg"
            >
              <Search className="h-4 w-4" />
              <span>Find a Tutor</span>
            </Link>
            <Link
              href="/signup?role=tutor"
              className="btn-nuzilo-secondary text-sm font-bold px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
            >
              <GraduationCap className="h-4 w-4 text-[#318A25]" />
              <span>I&apos;m a Tutor</span>
            </Link>
          </div>

          {/* Genuine Trust / Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Verified Subject Experts</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <Video className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Live Interactive Classroom</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <BarChart3 className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Visual Progress Tracking</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <Users className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Personalized Batches</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. MARKETPLACE PREVIEW */}
      <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
                Tutor Marketplace
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#172B4D] tracking-tight">
                Top Tutors on Nuzilo
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Connect with verified educators dedicated to personalized, concept-driven learning.
              </p>
            </div>
            <Link
              href="/tutors"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#318A25] hover:text-[#55C832] transition-colors"
            >
              <span>Explore all tutors</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tutorsToDisplay.map((tutor) => (
              <div
                key={tutor.id}
                className="bg-white rounded-3xl border-2 border-slate-100 hover:border-[#55C832]/50 p-6 transition-all hover:shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-[#55C832]/10 text-[#318A25] font-black text-lg flex items-center justify-center border border-[#55C832]/20">
                        {(tutor.name || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#172B4D] text-base leading-tight">
                          {tutor.name || 'Tutor'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <span>{tutor.location || 'Online'}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">{tutor.experience || 'Experienced'}</span>
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {tutor.headline}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {(tutor.subjects || []).map((sub: string) => (
                      <span
                        key={sub}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                      >
                        {sub}
                      </span>
                    ))}
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold capitalize">
                      {tutor.mode === 'both' ? 'Online & Offline' : (tutor.mode || 'Online')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>{tutor.rating}</span>
                    <span className="text-slate-400 text-[11px] font-normal">(Rating)</span>
                  </div>
                  <Link
                    href={`/tutors/${tutor.slug}`}
                    className="btn-nuzilo-secondary text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STUDENT JOURNEY (01-05) */}
      <section id="how-it-works" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#55C832]/15 px-3 py-1 rounded-full">
              Student Journey
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              From search to mastery in 5 clear steps
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              We made it simple to connect with mentors and build a consistent habit of learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Explore', desc: 'Search tutors by subject, curriculum, grade level, and language preference.', icon: Compass },
              { num: '02', title: 'Discover', desc: 'Review comprehensive profiles, credentials, teaching styles, and schedules.', icon: Search },
              { num: '03', title: 'Choose', desc: 'Select the right educator who matches your goals and learning rhythm.', icon: CheckCircle2 },
              { num: '04', title: 'Book', desc: 'Enroll seamlessly into interactive batches or targeted 1-on-1 sessions.', icon: Calendar },
              { num: '05', title: 'Learn', desc: 'Attend interactive classes, complete guided homework, and celebrate progress.', icon: GraduationCap },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-100 hover:border-[#55C832]/40 transition-all space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-[#318A25]/30 group-hover:text-[#318A25] transition-colors">
                      {step.num}
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-[#55C832]/10 text-[#318A25] flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-[#172B4D] text-base">{step.title}</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. POPULAR SUBJECTS GRID */}
      <section className="py-16 bg-white border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              Curriculum & Subjects
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#172B4D] tracking-tight">
              Explore Popular Subjects
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Find specialized educators across foundational and competitive academic streams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_SUBJECTS.map((sub) => (
              <Link
                key={sub.name}
                href={`/tutors?subject=${encodeURIComponent(sub.name)}`}
                className="p-4 rounded-2xl border border-slate-200 hover:border-[#55C832] bg-white hover:bg-slate-50/50 transition-all group flex items-start gap-3.5"
              >
                <div className="text-2xl p-2 rounded-xl bg-slate-100 group-hover:scale-105 transition-transform">
                  {sub.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-[#172B4D] text-sm group-hover:text-[#318A25] transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">{sub.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ONLINE CLASSROOM SHOWCASE */}
      <section id="classroom" className="py-20 bg-slate-900 text-white px-4 sm:px-6 overflow-hidden relative">
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
              Classroom 2.0
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              An online classroom built for actual learning
            </h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              No disconnected Zoom links or cluttered apps. Nuzilo brings video, dynamic whiteboarding, screen sharing, and live quizzes into one native workspace.
            </p>
          </div>

          {/* Interactive Classroom Mockup Frame */}
          <div className="rounded-3xl border-2 border-slate-700 bg-slate-950 p-3 sm:p-4 shadow-2xl">
            <div className="rounded-2xl bg-slate-900 p-4 sm:p-6 space-y-4">
              {/* Classroom header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-400 ml-2">
                    Nuzilo Live Classroom • Calculus Batch A
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                    🟢 Low Latency WebRTC
                  </span>
                  <span className="text-xs text-slate-400 font-mono">00:42:15</span>
                </div>
              </div>

              {/* Fast Answer Challenge preview banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      ⚡ In-Class Rapid Question
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold">
                      Points + Recognition
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    What is the derivative of f(x) = ln(x² + 1)?
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[#55C832] text-white font-bold text-xs shadow-md">
                    2x / (x² + 1) ✓
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs">
                    1 / (2x)
                  </span>
                </div>
              </div>

              {/* Whiteboard / Canvas features bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Whiteboard</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Multi-page drawing & PNG export</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Video className="h-3.5 w-3.5" />
                    <span>Crystal Video</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Direct peer WebRTC audio & video</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Users className="h-3.5 w-3.5" />
                    <span>Screen Sharing</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Present slides, code, or PDFs</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span>Attendance</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Auto logging with 1-click summary</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LEARNING ECOSYSTEM */}
      <section id="ecosystem" className="py-20 bg-white border-b border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-[#FAFBEF] px-3 py-1 rounded-full border border-emerald-100">
              Complete Learning Loop
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              The Nuzilo Learning Ecosystem
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Attending a class is just the beginning. Nuzilo reinforces retention through an integrated loop of practice, homework, and visual milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 hover:border-[#55C832]/40 transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#55C832]/20 text-[#318A25] flex items-center justify-center font-bold">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-[#172B4D]">Interactive Lessons & Classes</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Live, structured sessions with small batches or 1-on-1 focus. No distractions, just high-engagement concept mastery.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 hover:border-[#55C832]/40 transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-[#172B4D]">Practice Quizzes & Homework</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Immediate reinforcement after class. Tutors assign problems, and students get timely feedback on homework and tests.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFBEF] border-2 border-slate-100 hover:border-[#55C832]/40 transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-[#172B4D]">Progress Tracking & Milestones</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Visual progress maps and attendance streaks keep students motivated and parents completely informed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TUTOR SECTION */}
      <section id="tutors" className="py-20 bg-[#FAFBEF] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#318A25] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              For Educators
            </span>
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Put your teaching on Nuzilo
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              A complete, modern platform designed for tutors who want to grow their reach and teach with effortless operational tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#55C832] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-[#55C832]/10 text-[#318A25] flex items-center justify-center font-bold">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#172B4D] text-sm">Public Discovery Profile</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Showcase your experience, subjects, and batch offerings to students looking for tutors.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#55C832] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#172B4D] text-sm">Batch Management</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create batches, add students directly, set schedules, and manage class rosters with zero duplicate work.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#55C832] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#172B4D] text-sm">Native Live Classroom</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Teach inside Nuzilo with integrated whiteboard, screen sharing, and real-time student challenges.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#55C832] transition-all space-y-2">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#172B4D] text-sm">Automated Fee & WhatsApp</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track payments, generate receipts, and send automated class reminders to parents on WhatsApp.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/signup?role=tutor"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 inline-flex items-center gap-2 shadow-lg"
            >
              <span>Create Your Tutor Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. TWO CLEAR PATHS */}
      <section className="py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-[#172B4D] tracking-tight">
              Two Clear Paths. One Modern Platform.
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Choose your journey to get started immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Card */}
            <div className="rounded-3xl border-2 border-[#55C832]/30 bg-[#FAFBEF] p-8 space-y-6 flex flex-col justify-between hover:border-[#55C832] transition-all">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-[#55C832] text-white flex items-center justify-center font-bold shadow-md shadow-[#55C832]/30">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-[#318A25] uppercase tracking-wider">
                    For Students & Parents
                  </span>
                  <h3 className="text-2xl font-black text-[#172B4D]">
                    Looking for the right tutor?
                  </h3>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Search top-rated tutors, join live interactive classrooms, solve practice problems, and see your progress clearly every single week.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#55C832]" />
                    <span>Search verified tutors by subject & grade</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#55C832]" />
                    <span>Interactive online classes with live whiteboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#55C832]" />
                    <span>Homework submissions & test mark tracking</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/tutors"
                className="btn-nuzilo-primary text-sm font-black px-6 py-3.5 flex items-center justify-center gap-2 w-full shadow-md"
              >
                <span>Find a Tutor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Tutor Card */}
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 space-y-6 flex flex-col justify-between hover:border-[#55C832] transition-all">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-[#172B4D] text-white flex items-center justify-center font-bold shadow-md">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    For Tutors & Educators
                  </span>
                  <h3 className="text-2xl font-black text-[#172B4D]">
                    Are you an educator?
                  </h3>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Create your discoverable tutor profile, organize batch schedules, conduct live classes without third-party tools, and automate administrative tasks.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#55C832]" />
                    <span>Discoverable profile in Nuzilo Marketplace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#55C832]" />
                    <span>Batch creation with in-stride student enrollment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#55C832]" />
                    <span>Automated fee tracking & WhatsApp reminders</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup?role=tutor"
                className="btn-nuzilo-secondary text-sm font-black px-6 py-3.5 flex items-center justify-center gap-2 w-full bg-[#FAFBEF]"
              >
                <span>Teach on Nuzilo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL HIGH-CONTRAST CTA */}
      <section className="py-20 bg-gradient-to-br from-[#172B4D] via-[#10203a] to-[#0a1424] text-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to learn better and teach smarter?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-medium">
            Join students and independent educators experiencing modern, interactive tutoring on Nuzilo today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/tutors"
              className="btn-nuzilo-primary text-sm font-black px-8 py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto shadow-xl"
            >
              <Search className="h-4 w-4" />
              <span>Find Your Tutor Today</span>
            </Link>
            <Link
              href="/signup?role=tutor"
              className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>Become a Nuzilo Tutor</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 11. COMPREHENSIVE FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#55C832] text-white font-black text-lg shadow-sm">
                  N
                </div>
                <span className="text-xl font-black text-[#172B4D] tracking-tight">
                  Nuzilo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Discover tutors, explore subjects, book interactive classes, and track learning progress.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                For Students
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><Link href="/tutors" className="hover:text-slate-900 transition-colors">Find a Tutor</Link></li>
                <li><Link href="/tutors?subject=Mathematics" className="hover:text-slate-900 transition-colors">Mathematics Tutors</Link></li>
                <li><Link href="/tutors?subject=Physics" className="hover:text-slate-900 transition-colors">Physics Tutors</Link></li>
                <li><Link href="/student" className="hover:text-slate-900 transition-colors">Student Dashboard</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                For Tutors
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><Link href="/signup?role=tutor" className="hover:text-slate-900 transition-colors">Teach on Nuzilo</Link></li>
                <li><a href="#classroom" className="hover:text-slate-900 transition-colors">Online Classroom</a></li>
                <li><a href="#tutors" className="hover:text-slate-900 transition-colors">Batch Management</a></li>
                <li><Link href="/dashboard" className="hover:text-slate-900 transition-colors">Tutor Dashboard</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-slate-900 transition-colors">Create Account</Link></li>
                <li><a href="#how-it-works" className="hover:text-slate-900 transition-colors">How Nuzilo Works</a></li>
                <li><span className="text-slate-400">Privacy & Terms</span></li>
              </ul>
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
