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
            'flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:text-[#318A25] hover:bg-[#FAFBEF] border border-gray-200/80 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-[#55C832] cursor-pointer',
            className
          )}
          title="Nuzigo Help & Guides"
          aria-label="Open in-app help and guides"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFBEF] hover:bg-[#55C832]/20 text-[#318A25] text-xs font-semibold border border-gray-200 transition-colors shadow-2xs cursor-pointer',
            className
          )}
        >
          <HelpCircle className="h-3.5 w-3.5 text-[#318A25]" />
          <span>Help & Guides</span>
        </button>
      )}

      {/* Slide-over Help Drawer */}
      <HelpDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
