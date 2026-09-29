'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, GraduationCap, Users, CheckCircle2 } from 'lucide-react'

interface RoleOption {
  id: 'tutor' | 'student' | 'explore'
  emoji: string
  icon: React.ElementType
  title: string
  badge: string
  description: string
  ctaText: string
  href: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'tutor',
    emoji: '🧑‍🏫',
    icon: Users,
    title: "I'm a Tutor",
    badge: 'Educator & Mentor',
    description: 'Teach, manage your classes, and help your students progress with dedicated batch workflows.',
    ctaText: 'Explore Nuzigo for Tutors',
    href: '/for-tutors',
  },
  {
    id: 'student',
    emoji: '🎓',
    icon: GraduationCap,
    title: "I'm a Student",
    badge: 'Learner & Parent',
    description: 'Learn with tutors, stay on track, practice, and build better study habits every day.',
    ctaText: 'Explore Nuzigo for Students',
    href: '/for-students',
  },
  {
    id: 'explore',
    emoji: '✨',
    icon: Sparkles,
    title: "I'm Exploring",
    badge: 'Connected Platform',
    description: 'Discover what Nuzigo can do for you, your children, or your teaching practice.',
    ctaText: 'Explore Nuzigo',
    href: '/overview',
  },
]

export function PreLandingSelector() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const handleCardClick = (href: string, roleId: string) => {
    setSelectedRole(roleId)
    setIsNavigating(true)
    router.push(href)
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = selectedRole === option.id
          const Icon = option.icon

          return (
            <div
              key={option.id}
              onClick={() => handleCardClick(option.href, option.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardClick(option.href, option.id)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${option.title} - ${option.ctaText}`}
              className={`group relative rounded-3xl bg-white border-2 p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none text-left ${
                isSelected
                  ? 'border-[#55C832] shadow-xl shadow-[#55C832]/15 scale-[1.02] ring-2 ring-[#55C832]/30'
                  : 'border-slate-200/90 hover:border-[#55C832]/60 hover:shadow-lg hover:-translate-y-1'
              } focus:outline-none focus:ring-4 focus:ring-[#55C832]/25`}
            >
              {/* Card top */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl filter drop-shadow-xs" role="img" aria-label={option.title}>
                      {option.emoji}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#318A25] bg-[#55C832]/10 px-2.5 py-0.5 rounded-full border border-[#55C832]/20">
                      {option.badge}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#55C832]/15 group-hover:text-[#318A25] transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight group-hover:text-[#318A25] transition-colors">
                    {option.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Card bottom CTA */}
              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-[#318A25] flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
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

      {/* Loading feedback indicator */}
      {isNavigating && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-[#318A25] animate-pulse">
          <span className="h-2 w-2 rounded-full bg-[#55C832]" />
          <span>Opening your tailored Nuzigo experience...</span>
        </div>
      )}
    </div>
  )
}
