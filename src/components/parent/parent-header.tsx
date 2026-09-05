'use client'

import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import { ChildSwitcher } from './child-switcher'
import { ParentSidebar } from './parent-sidebar'
import { MobileDrawer } from '@/components/dashboard/mobile-drawer'
import type { ParentChildInfo } from '@/types'

interface ParentHeaderProps {
  parentName: string
  childrenList: ParentChildInfo[]
  selectedChildId: string
}

export function ParentHeader({
  parentName,
  childrenList,
  selectedChildId,
}: ParentHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open parent navigation menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="parent-mobile-nav-drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs font-bold text-gray-900">Hello, {parentName}</p>
          <p className="text-[11px] text-gray-500">Student Progress Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {childrenList.length > 0 && (
          <ChildSwitcher
            childrenList={childrenList}
            selectedChildId={selectedChildId}
          />
        )}
      </div>

      {/* Parent Mobile Navigation Drawer */}
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <ParentSidebar
          parentName={parentName}
          childQueryString={selectedChildId ? `child=${selectedChildId}` : ''}
          mobile
          onClose={() => setMobileMenuOpen(false)}
        />
      </MobileDrawer>
    </header>
  )
}
