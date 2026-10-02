'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StudentMobileNav() {
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Home',
      href: '/student',
      icon: Home,
      isActive: pathname === '/student',
    },
    {
      label: 'Your Tutor',
      href: '/student/tutors',
      icon: Users,
      isActive:
        pathname.startsWith('/student/tutors') ||
        pathname.startsWith('/student/classroom') ||
        pathname.startsWith('/student/classes') ||
        pathname.startsWith('/student/homework') ||
        pathname.startsWith('/student/tests') ||
        pathname.startsWith('/student/progress') ||
        pathname.startsWith('/student/messages'),
    },
    {
      label: 'Find Tutor',
      href: '/student/marketplace',
      icon: Compass,
      isActive: pathname.startsWith('/student/marketplace') || pathname.startsWith('/tutors'),
    },
    {
      label: 'Profile',
      href: '/student/settings',
      icon: User,
      isActive: pathname.startsWith('/student/settings'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-2 lg:hidden shadow-lg safe-area-pb"
      aria-label="Student Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isCurrent = tab.isActive

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 px-1.5 text-center min-w-[56px] min-h-[48px] transition-colors select-none',
              isCurrent ? 'text-[#318A25] font-bold' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isCurrent ? 'text-[#55C832]' : 'text-gray-400')} />
            <span className="text-[10px] sm:text-[11px] tracking-tight">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

