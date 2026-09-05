'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { MobileDrawer } from '@/components/dashboard/mobile-drawer'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar (visible on lg screens, hidden on mobile) */}
      <Sidebar />

      {/* Mobile Navigation Drawer (contains complete desktop sidebar content) */}
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />
      </MobileDrawer>

      {/* Main content area */}
      <div className={cn('lg:pl-64 flex flex-col min-h-screen')}>
        <Header
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation for quick actions */}
      <MobileNav />
    </div>
  )
}
