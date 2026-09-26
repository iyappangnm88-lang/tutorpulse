'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LogOut,
  Activity,
  X,
  UserPlus,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { STUDENT_NAV_ITEMS } from '@/lib/navigation'

export interface StudentSidebarProps {
  studentName: string
  mobile?: boolean
  onClose?: () => void
  onOpenJoinModal?: () => void
}

export function StudentSidebar({
  studentName,
  mobile = false,
  onClose,
  onOpenJoinModal,
}: StudentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    if (onClose) onClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        mobile
          ? 'flex flex-col h-full w-full bg-white select-none'
          : 'hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-gray-200/80'
      )}
      aria-label={mobile ? 'Student mobile navigation' : 'Student navigation'}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
        <Link
          href="/student"
          onClick={mobile ? onClose : undefined}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#58CC02] border-b-2 border-[#3C9E00] text-white shadow-xs font-black text-base">
            N
          </div>
          <span className="text-base font-black text-slate-900 tracking-tight">Nuzilo</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
            Student
          </span>
          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close student navigation menu"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-4 space-y-0.5 overscroll-contain"
        aria-label="Student navigation links"
      >
        {STUDENT_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/student'
              ? pathname === '/student'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? onClose : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 mx-2.5 min-h-[40px]',
                isActive
                  ? 'bg-indigo-50/90 text-indigo-700 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}

        {/* Action Button: Connect with Invite Code */}
        {onOpenJoinModal && (
          <div className="pt-3 px-3">
            <button
              type="button"
              onClick={() => {
                if (mobile && onClose) onClose()
                onOpenJoinModal()
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Join a Tutor</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{studentName}</p>
            <p className="text-[10px] text-gray-400">Student Account</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
