'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Users, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react'
import { NuzigoLogo } from '@/components/brand/nuzigo-logo'
import { isCapacitorNative } from '@/lib/capacitor'
import { createClient } from '@/lib/supabase/client'

interface PreLandingPageProps {
  currentUser: {
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
  dashboardHref: string
}

interface RoleOption {
  id: 'tutor' | 'student' | 'other'
  emoji: string
  icon: React.ElementType
  title: string
  tagline: string
  description: string
  ctaText: string
  href: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'tutor',
    emoji: '👨‍🏫',
    icon: Users,
    title: 'Tutor',
    tagline: 'Teach and grow with Nuzigo',
    description: 'Set up your teaching profile, get discovered, manage batches, and conduct live interactive classes.',
    ctaText: 'Continue as Tutor',
    href: '/for-tutors',
  },
  {
    id: 'student',
    emoji: '🎓',
    icon: GraduationCap,
    title: 'Student',
    tagline: 'Learn and track your progress',
    description: 'Find verified educators, attend live classes, solve quizzes, submit homework, and build study streaks.',
    ctaText: 'Continue as Student',
    href: '/for-students',
  },
  {
    id: 'other',
    emoji: '👪',
    icon: Sparkles,
    title: 'Other',
    tagline: 'Explore what Nuzigo can offer',
    description: 'For parents, learning institutions, and curious educators exploring our connected education ecosystem.',
    ctaText: 'Explore Nuzigo',
    href: '/overview',
  },
]

export function PreLandingPage({ currentUser, dashboardHref }: PreLandingPageProps) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isNativeRedirecting, setIsNativeRedirecting] = useState(false)

  useEffect(() => {
    // In Capacitor native Android app, if user is already authenticated with server-verified data,
    // seamlessly bypass the pre-landing page and navigate directly to their dashboard.
    if (isCapacitorNative() && currentUser && dashboardHref) {
      setIsNativeRedirecting(true)
      router.replace(dashboardHref)
      return
    }

    // Secondary client-side check in case cookies were refreshing or hydrating in the native shell
    if (isCapacitorNative() && !currentUser) {
      const supabase = createClient()
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        let target = '/dashboard'
        const role = profile?.role
        const isOnboarded = Boolean(profile?.onboarding_completed)

        if (role === 'parent') {
          target = '/parent'
        } else if (!isOnboarded) {
          if (role === 'student') target = '/onboarding/student'
          else if (role === 'tutor') target = '/onboarding/tutor'
          else target = '/onboarding/role'
        } else if (role === 'student') {
          target = '/student'
        } else if (role === 'tutor') {
          target = '/dashboard'
        }

        setIsNativeRedirecting(true)
        router.replace(target)
      })
    }
  }, [currentUser, dashboardHref, router])

  const handleRoleSelect = (href: string, roleId: string) => {
    setSelectedRole(roleId)
    setIsNavigating(true)
    router.push(href)
  }

  if (isNativeRedirecting) {
    return (
      <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#55C832] p-2.5 text-white shadow-lg shadow-[#55C832]/30">
            <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
          </div>
          <div className="h-5 w-5 rounded-full border-2 border-[#55C832] border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBEF] text-[#172B4D] flex flex-col justify-between font-sans selection:bg-[#55C832] selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#55C832] p-1.5 text-white shadow-md shadow-[#55C832]/30 group-hover:scale-105 transition-transform">
              <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#172B4D] tracking-tight leading-none">
                NUZIGO
              </span>
              <span className="text-[10px] font-bold text-[#318A25] tracking-wide">
                Education Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href={dashboardHref}
                className="btn-nuzigo-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Fast, simple role selection gateway */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl w-full mx-auto text-center space-y-10">
          {/* Header Text */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#55C832]/15 border border-[#55C832]/30 text-[#318A25] text-xs font-black tracking-wide">
              <span>Welcome to Nuzigo</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#172B4D] tracking-tight">
              What brings you to Nuzigo?
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
              Select your path to view an experience tailored specifically to you.
            </p>
          </div>

          {/* Three Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left">
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.id
              const Icon = option.icon

              return (
                <div
                  key={option.id}
                  onClick={() => handleRoleSelect(option.href, option.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleRoleSelect(option.href, option.id)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${option.title}: ${option.tagline}. ${option.ctaText}`}
                  className={`group relative rounded-3xl bg-white border-2 p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-[#55C832] shadow-xl shadow-[#55C832]/15 scale-[1.02] ring-2 ring-[#55C832]/30'
                      : 'border-slate-200/90 hover:border-[#55C832]/60 hover:shadow-lg hover:-translate-y-1'
                  } focus:outline-none focus:ring-4 focus:ring-[#55C832]/25`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl filter drop-shadow-xs" role="img" aria-label={option.title}>
                        {option.emoji}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#55C832]/15 group-hover:text-[#318A25] transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight group-hover:text-[#318A25] transition-colors">
                        {option.title}
                      </h2>
                      <p className="text-xs sm:text-sm font-bold text-[#318A25]">
                        &ldquo;{option.tagline}&rdquo;
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-[#318A25] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      <span>{option.ctaText}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </span>

                    {isSelected && (
                      <span className="inline-flex items-center text-xs font-bold text-[#318A25]">
                        <CheckCircle2 className="h-4 w-4 text-[#55C832]" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation feedback */}
          {isNavigating && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#318A25] animate-pulse">
              <span className="h-2 w-2 rounded-full bg-[#55C832]" />
              <span>Opening your tailored Nuzigo experience...</span>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-6 text-xs text-slate-500 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} NUZIGO. All rights reserved.</p>
          <div className="flex items-center gap-4 font-bold text-slate-600">
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
            <span>•</span>
            <Link href="/for-tutors" className="hover:text-slate-900 transition-colors">For Tutors</Link>
            <span>•</span>
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">For Students</Link>
            <span>•</span>
            <Link href="/overview" className="hover:text-slate-900 transition-colors">Overview</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
