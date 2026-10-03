'use client'

import React from 'react'
import Link from 'next/link'
import { UserPlus, Compass, Clock } from 'lucide-react'
import { useStudentNav } from '@/contexts/student-nav-context'
import { Button } from '@/components/ui/button'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'

interface StudentHeaderProps {
  studentName: string
  avatarUrl?: string | null
  gradeLevel?: string | null
}

export function StudentHeader({
  studentName,
  avatarUrl,
  gradeLevel,
}: StudentHeaderProps) {
  const { openJoinModal, isEnrolled, pendingCount } = useStudentNav()
  const initial = (studentName || 'S').trim().charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-17 sm:h-18 items-center justify-between border-b border-gray-200/70 dark:border-[#293329] bg-white/85 dark:bg-[#111711]/85 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm sm:text-base font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight">Hello, {studentName} 🎓</p>
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
            {gradeLevel ? 'Class ' + gradeLevel + ' · Student Portal' : 'Student Learning Portal'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggleButton />
        {isEnrolled ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openJoinModal}
              className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#318A25] dark:text-gray-300 dark:hover:text-[#6BEA45] px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1C261C] flex items-center gap-1.5 transition-colors min-h-[42px] cursor-pointer"
              title="Connect with invite code"
            >
              <UserPlus className="h-4 w-4 text-gray-400 dark:text-[#A8B3A5]" />
              <span className="hidden sm:inline">Invite Code</span>
            </button>
            <Link href="/student/marketplace">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm font-bold flex items-center gap-1.5 border-gray-200 dark:border-[#293329] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1C261C] min-h-[42px] px-3.5 rounded-xl cursor-pointer"
              >
                <Compass className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
                <span className="hidden sm:inline">Explore Tutors</span>
                <span className="sm:hidden">Explore</span>
              </Button>
            </Link>
          </div>
        ) : pendingCount > 0 ? (
          <Link href="/student/tutors">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 shadow-2xs hover:bg-amber-100 transition-colors min-h-[40px]">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Pending Request</span>
            </span>
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openJoinModal}
            className="text-xs sm:text-sm font-bold flex items-center gap-1.5 border-emerald-200 dark:border-emerald-800/60 text-[#318A25] dark:text-[#6BEA45] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 min-h-[42px] px-3.5 rounded-xl cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
            <span className="hidden sm:inline">Join a Tutor</span>
            <span className="sm:hidden">Join</span>
          </Button>
        )}

        {/* Profile Avatar Entry Point */}
        <Link
          href="/student/profile"
          prefetch={true}
          aria-label="Open your profile and personal hub"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2 ring-[#55C832]/40 hover:ring-[#55C832] dark:hover:ring-[#6BEA45] transition-all overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C832] shadow-2xs"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={studentName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-[#318A25] to-[#55C832] text-white text-sm font-black shadow-2xs">
              {initial}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
