'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, CalendarCheck, Award, BookOpen, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ParentMobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const childQuery = searchParams.get('child')
  const queryStr = childQuery ? `?child=${childQuery}` : ''

  const tabs = [
    { label: 'Home', href: '/parent', icon: Home },
    { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck },
    { label: 'Tests', href: '/parent/tests', icon: Award },
    { label: 'Homework', href: '/parent/homework', icon: BookOpen },
    { label: 'Fees', href: '/parent/fees', icon: CreditCard },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white px-2 lg:hidden shadow-lg"
      aria-label="Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/parent'
            ? pathname === '/parent'
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={`${tab.href}${queryStr}`}
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
