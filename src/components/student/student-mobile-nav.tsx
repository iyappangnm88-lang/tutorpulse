'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Sparkles, Video, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StudentMobileNav() {
  const pathname = usePathname()

  const tabs = [
    { label: 'Home', href: '/student', icon: Home },
    { label: 'Explore', href: '/student/marketplace', icon: Compass },
    { label: 'Learn', href: '/student#path', icon: Sparkles, isPrimary: true },
    { label: 'Classes', href: '/student/classes', icon: Video },
    { label: 'Profile', href: '/student/settings', icon: User },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 lg:hidden shadow-lg"
      aria-label="Student Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/student'
            ? pathname === '/student'
            : tab.href === '/student#path'
            ? pathname === '/student'
            : pathname.startsWith(tab.href)

        if (tab.isPrimary) {
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="relative -top-3 flex flex-col items-center justify-center group"
            >
              <div className="h-12 w-12 rounded-full bg-[#58CC02] border-b-4 border-[#3C9E00] text-white flex items-center justify-center shadow-lg group-active:translate-y-0.5 group-active:border-b-2 transition-all">
                <tab.icon className="h-6 w-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-[#3C9E00] mt-0.5">{tab.label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-2.5 text-center min-w-[56px] transition-colors',
              isActive ? 'text-[#3C9E00] font-bold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isActive ? 'text-[#58CC02]' : 'text-slate-400')} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

