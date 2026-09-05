'use client'

import React, { useState, useRef, useEffect } from 'react'
import { HelpCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: React.ReactNode
  icon?: 'help' | 'info'
  className?: string
  align?: 'left' | 'center' | 'right'
  title?: string
}

export function HelpTooltip({
  content,
  icon = 'help',
  className,
  align = 'center',
  title,
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const alignmentClasses = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
  }[align]

  const IconComponent = icon === 'info' ? Info : HelpCircle

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors cursor-pointer"
        aria-label={title || 'Help info'}
        aria-expanded={open}
      >
        <IconComponent className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="tooltip"
          className={cn(
            'absolute bottom-full mb-2 z-50 w-64 max-w-xs rounded-xl bg-gray-900/95 backdrop-blur-xs p-3 text-xs text-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-150 pointer-events-auto',
            alignmentClasses
          )}
        >
          {title && <p className="font-semibold text-white mb-1 border-b border-gray-700/60 pb-1">{title}</p>}
          <div className="text-gray-200 leading-relaxed font-normal">{content}</div>
          {/* Subtle caret triangle */}
          <div
            className={cn(
              'absolute top-full -mt-1 h-2 w-2 rotate-45 bg-gray-900/95',
              align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'left' ? 'left-2' : 'right-2'
            )}
          />
        </div>
      )}
    </div>
  )
}
