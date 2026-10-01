'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface StudentNavContextType {
  isMobileMenuOpen: boolean
  openMobileMenu: () => void
  closeMobileMenu: () => void
  toggleMobileMenu: () => void
  isJoinModalOpen: boolean
  openJoinModal: () => void
  closeJoinModal: () => void
  isEnrolled: boolean
  pendingCount: number
}

const StudentNavContext = createContext<StudentNavContextType | undefined>(undefined)

export function StudentNavProvider({
  children,
  isEnrolled = false,
  pendingCount = 0,
}: {
  children: React.ReactNode
  isEnrolled?: boolean
  pendingCount?: number
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const pathname = usePathname()

  // Automatically close mobile menu on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const openMobileMenu = () => setIsMobileMenuOpen(true)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev)

  const openJoinModal = () => {
    setIsMobileMenuOpen(false)
    setIsJoinModalOpen(true)
  }
  const closeJoinModal = () => setIsJoinModalOpen(false)

  return (
    <StudentNavContext.Provider
      value={{
        isMobileMenuOpen,
        openMobileMenu,
        closeMobileMenu,
        toggleMobileMenu,
        isJoinModalOpen,
        openJoinModal,
        closeJoinModal,
        isEnrolled,
        pendingCount,
      }}
    >
      {children}
    </StudentNavContext.Provider>
  )
}

export function useStudentNav() {
  const context = useContext(StudentNavContext)
  if (!context) {
    throw new Error('useStudentNav must be used within a StudentNavProvider')
  }
  return context
}
