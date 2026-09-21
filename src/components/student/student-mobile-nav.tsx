'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Video, BookOpen, Award, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StudentMobileNav() {
  const pathname = usePathname()

  const tabs = [
    { label: 'Home', href: '/student', icon: Home },
    { label: 'Classes', href: '/student/classes', icon: Video },
    { label: 'Homework', href: '/student/homework', icon: BookOpen },
    { label: 'Tests', href: '/student/tests', icon: Award },
    { label: 'Tutors', href: '/student/tutors', icon: Users },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white px-2 lg:hidden shadow-lg"
      aria-label="Student Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/student'
            ? pathname === '/student'
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-2.5 text-center min-w-[56px] transition-colors',
              isActive ? 'text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-gray-400')} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
