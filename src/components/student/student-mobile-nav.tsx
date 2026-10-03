'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, Compass, Users, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudentNav } from '@/contexts/student-nav-context'

export function StudentMobileNav() {
  const pathname = usePathname()

  let isEnrolled = false
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const navContext = useStudentNav()
    isEnrolled = navContext.isEnrolled
  } catch {
    // Context may not be mounted in isolated render
  }

  const allTabs = [
    {
      label: 'Focus',
      href: '/student',
      icon: Target,
      isActive: pathname === '/student',
      show: true,
    },
    {
      label: 'Your Tutor',
      href: '/student/tutors',
      icon: GraduationCap,
      isActive:
        pathname.startsWith('/student/tutors') ||
        pathname.startsWith('/student/classroom') ||
        pathname.startsWith('/student/classes') ||
        pathname.startsWith('/student/homework') ||
        pathname.startsWith('/student/tests') ||
        pathname.startsWith('/student/progress') ||
        pathname.startsWith('/student/messages'),
      show: isEnrolled,
    },
    {
      label: 'Find Tutor',
      href: '/student/marketplace',
      icon: Compass,
      isActive: pathname.startsWith('/student/marketplace') || pathname.startsWith('/tutors'),
      show: true,
    },
    {
      label: 'Study Groups',
      href: '/student/study-groups',
      icon: Users,
      isActive: pathname.startsWith('/student/study-groups'),
      show: true,
    },
  ]

  const tabs = allTabs.filter((t) => t.show)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-18 items-center justify-around border-t border-gray-200/80 dark:border-[#293329] bg-white/95 dark:bg-[#111711]/95 backdrop-blur-md px-2 lg:hidden shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      aria-label="Student Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isCurrent = tab.isActive

        return (
          <Link
            key={tab.label}
            href={tab.href}
            prefetch={true}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center min-w-[64px] min-h-[52px] transition-colors select-none',
              isCurrent ? 'text-[#318A25] dark:text-[#6BEA45] font-black' : 'text-gray-500 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <tab.icon className={cn('h-6 w-6 stroke-[2.2]', isCurrent ? 'text-[#55C832] dark:text-[#6BEA45]' : 'text-gray-400 dark:text-[#6C7A6A]')} />
            <span className="text-xs font-semibold tracking-tight leading-none">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

