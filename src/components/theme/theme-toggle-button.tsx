'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

interface ThemeToggleButtonProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggleButton({ className = '', showLabel = false }: ThemeToggleButtonProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`flex items-center gap-2 p-2 rounded-xl text-gray-600 dark:text-[#A8B3A5] hover:text-[#172B4D] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C261C] transition-all cursor-pointer ${className}`}
    >
      <div className="relative h-5 w-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4.5 w-4.5 text-[#FFD84A] transition-transform rotate-0 hover:rotate-45 duration-200" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-[#172B4D] transition-transform rotate-0 hover:-rotate-12 duration-200" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  )
}
