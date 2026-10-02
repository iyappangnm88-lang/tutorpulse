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
import { getStudentNavItems, type NavItem } from '@/lib/navigation'
import { useStudentNav } from '@/contexts/student-nav-context'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'

export interface StudentSidebarProps {
  studentName: string
  avatarUrl?: string | null
  mobile?: boolean
  onClose?: () => void
  onOpenJoinModal?: () => void
}

export function StudentSidebar({
  studentName,
  avatarUrl,
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

  const isEnrolled = navContext?.isEnrolled ?? false
  const pendingCount = navContext?.pendingCount ?? 0

  const handleClose = onClose || (navContext ? navContext.closeMobileMenu : undefined)
  const handleOpenJoin = onOpenJoinModal || (navContext ? navContext.openJoinModal : undefined)

  async function handleLogout() {
    if (handleClose) handleClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const renderNavLink = (item: NavItem) => {
    let isActive = false
    if (item.href === '/student') {
      isActive = pathname === '/student'
    } else if (item.href === '/student/tutors') {
      isActive =
        pathname.startsWith('/student/tutors') ||
        pathname.startsWith('/student/classroom') ||
        pathname.startsWith('/student/classes') ||
        pathname.startsWith('/student/homework') ||
        pathname.startsWith('/student/tests') ||
        pathname.startsWith('/student/progress') ||
        pathname.startsWith('/student/messages')
    } else if (item.href === '/student/marketplace') {
      isActive = pathname.startsWith('/student/marketplace') || pathname.startsWith('/tutors')
    } else {
      isActive = pathname.startsWith(item.href)
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        onClick={mobile ? handleClose : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 mx-2.5 min-h-[42px]',
          isActive
            ? 'bg-[#55C832]/12 dark:bg-[#6BEA45]/15 text-[#318A25] dark:text-[#6BEA45] font-bold shadow-2xs border border-[#55C832]/25 dark:border-[#6BEA45]/30'
            : 'text-gray-600 dark:text-[#A8B3A5] hover:bg-gray-100/70 dark:hover:bg-[#1C261C] hover:text-[#172B4D] dark:hover:text-[#F4F7F2]'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon
          className={cn(
            'h-4.5 w-4.5 shrink-0 transition-colors duration-150',
            isActive ? 'text-[#55C832] dark:text-[#6BEA45]' : 'text-gray-400 dark:text-[#6C7A6A] group-hover:text-gray-600 dark:group-hover:text-[#A8B3A5]'
          )}
          aria-hidden="true"
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.href === '/student/tutors' && isEnrolled && (
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
        )}
        {item.href === '/student/tutors' && !isEnrolled && pendingCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
            Pending
          </span>
        )}
        {isActive && !isEnrolled && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#55C832]" aria-hidden="true" />
        )}
      </Link>
    )
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
              Nuzigo
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
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-4 space-y-1.5 overscroll-contain"
        aria-label="Student navigation links"
      >
        {getStudentNavItems(isEnrolled).map(renderNavLink)}

        {/* Action Button: Connect with Invite Code */}
        {handleOpenJoin && (
          <div className="pt-4 px-3">
            <button
              type="button"
              onClick={() => {
                if (mobile && handleClose) handleClose()
                handleOpenJoin()
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-[#318A25] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#55C832]" />
              <span>{isEnrolled ? 'Enter Invite Code' : 'Join a Tutor'}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-gray-100 dark:border-[#202920] p-4 space-y-2">
        <Link
          href="/student/profile"
          prefetch={true}
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1C261C] transition-colors group cursor-pointer"
          title="Open Profile"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#318A25] dark:text-[#6BEA45] text-xs font-bold shadow-2xs overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={studentName} className="h-full w-full object-cover" />
            ) : (
              (studentName || 'S').trim().charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] truncate group-hover:text-[#318A25] dark:group-hover:text-[#6BEA45] transition-colors">
              {studentName}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-[#6C7A6A]">View Profile</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
