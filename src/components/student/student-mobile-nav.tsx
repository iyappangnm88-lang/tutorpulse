'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Video, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudentNav } from '@/contexts/student-nav-context'

export function StudentMobileNav() {
  const pathname = usePathname()
  const { openMobileMenu } = useStudentNav()

  const tabs = [
    {
      label: 'Home',
      href: '/student',
      icon: Home,
      isActive: pathname === '/student',
    },
    {
      label: 'Classes',
      href: '/student/classes',
      icon: Video,
      isActive: pathname.startsWith('/student/classes') || pathname.startsWith('/student/classroom'),
    },
    {
      label: 'Find Tutors',
      href: '/student/marketplace',
      icon: Compass,
      isActive: pathname.startsWith('/student/marketplace'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-3 lg:hidden shadow-lg safe-area-pb"
      aria-label="Student Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isCurrent = tab.isActive

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 px-2 text-center min-w-[56px] min-h-[48px] transition-colors select-none',
              isCurrent ? 'text-[#318A25] font-bold' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isCurrent ? 'text-[#55C832]' : 'text-gray-400')} />
            <span className="text-[11px] tracking-tight">{tab.label}</span>
          </Link>
        )
      })}

      {/* 4th Tab: Full Menu Trigger */}
      <button
        type="button"
        onClick={openMobileMenu}
        aria-label="Open full student menu"
        className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 px-2 text-center min-w-[56px] min-h-[48px] text-gray-500 hover:text-gray-900 transition-colors select-none cursor-pointer"
      >
        <Menu className="h-5 w-5 text-gray-400" />
        <span className="text-[11px] tracking-tight font-medium">Menu</span>
      </button>
    </nav>
  )
}

