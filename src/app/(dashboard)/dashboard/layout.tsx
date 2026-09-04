'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main content */}
      <div className={cn('lg:pl-64 flex flex-col min-h-screen')}>
        <Header
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  )
}
