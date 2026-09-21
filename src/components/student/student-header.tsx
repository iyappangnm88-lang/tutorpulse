'use client'

import React, { useState } from 'react'
import { Menu, UserPlus } from 'lucide-react'
import { StudentSidebar } from './student-sidebar'
import { MobileDrawer } from '@/components/dashboard/mobile-drawer'
import { JoinTutorModal } from './join-tutor-modal'
import { Button } from '@/components/ui/button'

interface StudentHeaderProps {
  studentName: string
  gradeLevel?: string | null
}

export function StudentHeader({
  studentName,
  gradeLevel,
}: StudentHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open student navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-bold text-gray-900">Hello, {studentName} 🎓</p>
            <p className="text-[11px] text-gray-500">
              {gradeLevel ? `Class ${gradeLevel} · Student Portal` : 'Student Learning Portal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setJoinModalOpen(true)}
            className="text-xs flex items-center gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Join a Tutor</span>
            <span className="sm:hidden">Join</span>
          </Button>
        </div>

        {/* Student Mobile Navigation Drawer */}
        <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
          <StudentSidebar
            studentName={studentName}
            mobile
            onClose={() => setMobileMenuOpen(false)}
            onOpenJoinModal={() => {
              setMobileMenuOpen(false)
              setJoinModalOpen(true)
            }}
          />
        </MobileDrawer>
      </header>

      {/* Join Tutor Modal */}
      <JoinTutorModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </>
  )
}
