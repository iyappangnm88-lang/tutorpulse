'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, UserPlus, Compass, Clock } from 'lucide-react'
import { useStudentNav } from '@/contexts/student-nav-context'
import { Button } from '@/components/ui/button'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'

interface StudentHeaderProps {
  studentName: string
  gradeLevel?: string | null
}

export function StudentHeader({
  studentName,
  gradeLevel,
}: StudentHeaderProps) {
  const { openMobileMenu, openJoinModal, isEnrolled, pendingCount } = useStudentNav()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/70 dark:border-[#293329] bg-white/80 dark:bg-[#111711]/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 dark:text-[#A8B3A5] hover:bg-gray-100 dark:hover:bg-[#1C261C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C832]"
          onClick={openMobileMenu}
          aria-label="Open student navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2]">Hello, {studentName} 🎓</p>
          <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">
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
              className="text-xs font-semibold text-gray-600 hover:text-[#318A25] px-2 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1 transition-colors"
              title="Connect with invite code"
            >
              <UserPlus className="h-3.5 w-3.5 text-gray-400" />
              <span className="hidden sm:inline">Invite Code</span>
            </button>
            <Link href="/student/marketplace">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Compass className="h-3.5 w-3.5 text-[#55C832]" />
                <span className="hidden sm:inline">Explore Tutors</span>
                <span className="sm:hidden">Explore</span>
              </Button>
            </Link>
          </div>
        ) : pendingCount > 0 ? (
          <Link href="/student/tutors">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs hover:bg-amber-100 transition-colors">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Pending Request</span>
            </span>
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openJoinModal}
            className="text-xs flex items-center gap-1.5 border-emerald-200 text-[#318A25] hover:bg-emerald-50 hover:border-emerald-300"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#55C832]" />
            <span className="hidden sm:inline">Join a Tutor</span>
            <span className="sm:hidden">Join</span>
          </Button>
        )}
      </div>
    </header>
  )
}
