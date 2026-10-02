'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { StudentNavProvider, useStudentNav } from '@/contexts/student-nav-context'
import { StudentSidebar } from './student-sidebar'
import { StudentMobileNav } from './student-mobile-nav'
import { StudentHeader } from './student-header'

const JoinTutorModal = dynamic(
  () => import('./join-tutor-modal').then((m) => m.JoinTutorModal),
  { ssr: false }
)

interface StudentLayoutClientProps {
  displayName: string
  avatarUrl?: string | null
  gradeLevel?: string | null
  isEnrolled?: boolean
  pendingCount?: number
  children: React.ReactNode
}

function StudentLayoutInner({ displayName, avatarUrl, gradeLevel, children }: StudentLayoutClientProps) {
  const { isJoinModalOpen, closeJoinModal } = useStudentNav()

  return (
    <div className="min-h-screen bg-[#FAFBEF] dark:bg-[#0B0F0C] text-[#172B4D] dark:text-[#F4F7F2] flex flex-col">
      {/* Desktop Sidebar (Fixed left) */}
      <StudentSidebar studentName={displayName} avatarUrl={avatarUrl} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        <StudentHeader studentName={displayName} avatarUrl={avatarUrl} gradeLevel={gradeLevel} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Join Tutor Modal */}
      <JoinTutorModal isOpen={isJoinModalOpen} onClose={closeJoinModal} />

      {/* Mobile Bottom Navigation */}
      <StudentMobileNav />
    </div>
  )
}

export function StudentLayoutClient(props: StudentLayoutClientProps) {
  return (
    <StudentNavProvider isEnrolled={props.isEnrolled} pendingCount={props.pendingCount}>
      <StudentLayoutInner {...props} />
    </StudentNavProvider>
  )
}
