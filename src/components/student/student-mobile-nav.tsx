'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Sparkles, Video, BookOpen, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudentNav } from '@/contexts/student-nav-context'

export function StudentMobileNav() {
  const pathname = usePathname()
  const { openMobileMenu } = useStudentNav()

  const tabs = [
    { label: 'Home', href: '/student', icon: Home },
    {
      label: 'Classes',
      href: '/student/classes',
      icon: Video,
      isActive: pathname.startsWith('/student/classes') || pathname.startsWith('/student/classroom'),
    },
    {
      label: 'Journey',
      href: '/student#journey',
      icon: Sparkles,
      isPrimary: true,
      isActive: pathname === '/student',
    },
    {
      label: 'Homework',
      href: '/student/homework',
      icon: BookOpen,
      isActive: pathname.startsWith('/student/homework'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-2 lg:hidden shadow-lg"
      aria-label="Student Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isCurrent =
          tab.isActive !== undefined
            ? tab.isActive
            : tab.href === '/student'
            ? pathname === '/student'
            : pathname.startsWith(tab.href)

        if (tab.isPrimary) {
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="relative -top-3 flex flex-col items-center justify-center group select-none"
            >
              <div className="h-12 w-12 rounded-full bg-[#55C832] border-b-4 border-[#318A25] text-white flex items-center justify-center shadow-lg group-active:translate-y-0.5 group-active:border-b-2 transition-all">
                <tab.icon className="h-6 w-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-[#318A25] mt-0.5">{tab.label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-2.5 text-center min-w-[56px] transition-colors select-none',
              isCurrent ? 'text-[#318A25] font-bold' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isCurrent ? 'text-[#55C832]' : 'text-gray-400')} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        )
      })}

      {/* 5th Tab: Full Menu Trigger */}
      <button
        type="button"
        onClick={openMobileMenu}
        aria-label="Open full student menu"
        className="flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-2.5 text-center min-w-[56px] text-gray-500 hover:text-gray-900 transition-colors select-none"
      >
        <Menu className="h-5 w-5 text-gray-400" />
        <span className="text-[10px] tracking-tight font-medium">Menu</span>
      </button>
    </nav>
  )
}
