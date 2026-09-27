'use client'

import React from 'react'
import { Menu, UserPlus } from 'lucide-react'
import { useStudentNav } from '@/contexts/student-nav-context'
import { Button } from '@/components/ui/button'

interface StudentHeaderProps {
  studentName: string
  gradeLevel?: string | null
}

export function StudentHeader({
  studentName,
  gradeLevel,
}: StudentHeaderProps) {
  const { openMobileMenu, openJoinModal } = useStudentNav()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C832]"
          onClick={openMobileMenu}
          aria-label="Open student navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs font-bold text-[#172B4D]">Hello, {studentName} 🎓</p>
          <p className="text-[11px] text-gray-500">
            {gradeLevel ? 'Class ' + gradeLevel + ' · Student Portal' : 'Student Learning Portal'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
      </div>
    </header>
  )
}
