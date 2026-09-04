'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Layers, ClipboardCheck, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/dashboard/students', icon: Users },
  { label: 'Batches', href: '/dashboard/batches', icon: Layers },
  { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: 'Fees', href: '/dashboard/fees', icon: CreditCard },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/80 bg-white/95 backdrop-blur-md lg:hidden shadow-lg"
      aria-label="Mobile navigation"
    >
      <ul className="flex h-16 items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <li key={item.label} className="flex-1 flex justify-center">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full py-1 rounded-xl transition-all',
                  'min-h-[44px]',
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon
                  className={cn('h-5 w-5 transition-transform duration-150', isActive && 'scale-110')}
                  aria-hidden="true"
                />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
