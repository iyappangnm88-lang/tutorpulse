'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LogOut,
  X,
  UserPlus,
  Home,
  Users,
  Video,
  BookOpen,
  Award,
  BarChart3,
  MessageSquare,
  Settings,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { STUDENT_NAV_ITEMS } from '@/lib/navigation'
import { useStudentNav } from '@/contexts/student-nav-context'

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

  // Fallback to student nav context if callbacks are not provided
  let navContext: ReturnType<typeof useStudentNav> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navContext = useStudentNav()
  } catch {
    // Context may not be mounted in test or isolated render
  }

  const handleClose = onClose || (navContext ? navContext.closeMobileMenu : undefined)
  const handleOpenJoin = onOpenJoinModal || (navContext ? navContext.openJoinModal : undefined)

  async function handleLogout() {
    if (handleClose) handleClose()
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
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
        <Link
          href="/student"
          onClick={mobile ? handleClose : undefined}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#55C832] border-b-2 border-[#318A25] text-white shadow-xs font-black text-base">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#172B4D] tracking-tight flex items-center gap-1.5">
              Nuzilo
              <span className="text-[10px] font-bold text-[#318A25] bg-[#55C832]/15 px-1.5 py-0.5 rounded border border-[#55C832]/30">
                Student
              </span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Learn • Practice • Grow</span>
          </div>
        </Link>

        {mobile && handleClose && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-3 space-y-0.5 overscroll-contain"
        aria-label="Student navigation links"
      >
        {STUDENT_NAV_ITEMS.map((item) => {
          // Robust active route detection
          let isActive = false
          if (item.href === '/student') {
            isActive = pathname === '/student'
          } else if (item.href === '/student/classes') {
            isActive = pathname.startsWith('/student/classes') || pathname.startsWith('/student/classroom')
          } else {
            isActive = pathname.startsWith(item.href)
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? handleClose : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 mx-2.5 min-h-[40px]',
                isActive
                  ? 'bg-[#55C832]/12 text-[#318A25] font-bold shadow-2xs border border-[#55C832]/25'
                  : 'text-gray-600 hover:bg-gray-100/70 hover:text-[#172B4D]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-[#55C832]' : 'text-gray-400 group-hover:text-gray-600'
                )}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#55C832]" aria-hidden="true" />
              )}
            </Link>
          )
        })}

        {/* Action Button: Connect with Invite Code */}
        {handleOpenJoin && (
          <div className="pt-3 px-3">
            <button
              type="button"
              onClick={() => {
                if (mobile && handleClose) handleClose()
                handleOpenJoin()
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-[#318A25] text-xs font-bold transition-all shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Join a Tutor</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#318A25] text-xs font-bold shadow-2xs">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#172B4D] truncate">{studentName}</p>
            <p className="text-[10px] text-gray-400">Student Account</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
