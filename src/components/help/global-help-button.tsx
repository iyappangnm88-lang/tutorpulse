'use client'

import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { HelpDrawer } from './help-drawer'
import { cn } from '@/lib/utils'

interface GlobalHelpButtonProps {
  className?: string
  variant?: 'icon' | 'pill'
}

export function GlobalHelpButton({ className, variant = 'icon' }: GlobalHelpButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200/80 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer',
            className
          )}
          title="TutorPulse Help & Guides"
          aria-label="Open in-app help and guides"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-colors shadow-2xs cursor-pointer',
            className
          )}
        >
          <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
          <span>Help & Guides</span>
        </button>
      )}

      {/* Slide-over Help Drawer */}
      <HelpDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
