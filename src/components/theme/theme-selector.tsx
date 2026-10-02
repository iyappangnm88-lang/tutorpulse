'use client'

import React from 'react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/contexts/theme-context'

interface ThemeSelectorProps {
  className?: string
  variant?: 'segmented' | 'cards' | 'dropdown'
}

const THEME_OPTIONS: Array<{
  id: ThemeMode
  label: string
  description: string
  icon: React.ElementType
}> = [
  {
    id: 'light',
    label: 'Light Mode',
    description: 'Clean Nuzigo emerald & cream aesthetic',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Obsidian Dark',
    description: 'Deep obsidian with electric green accents',
    icon: Moon,
  },
  {
    id: 'system',
    label: 'System Preference',
    description: 'Matches your OS or device appearance',
    icon: Laptop,
  },
]

export function ThemeSelector({ className = '', variant = 'cards' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()

  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme mode"
        className={`inline-flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] ${className}`}
      >
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isSelected = theme === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-[#1C261C] text-[#172B4D] dark:text-[#F4F7F2] shadow-xs border border-gray-200/60 dark:border-[#384638]'
                  : 'text-gray-500 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-[#55C832] dark:text-[#6BEA45]' : 'text-current'}`} />
              <span>{opt.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isSelected = theme === opt.id

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
              isSelected
                ? 'bg-emerald-50/50 dark:bg-[#1C261C] border-[#55C832] dark:border-[#6BEA45] ring-2 ring-[#55C832]/20 dark:ring-[#6BEA45]/20 shadow-xs'
                : 'bg-white dark:bg-[#161D16] border-gray-200/80 dark:border-[#293329] hover:border-gray-300 dark:hover:border-[#384638]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs ${
                  isSelected
                    ? 'bg-[#55C832] dark:bg-[#6BEA45] text-white dark:text-[#0B0F0C]'
                    : 'bg-gray-100 dark:bg-[#111711] text-gray-600 dark:text-[#A8B3A5]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {isSelected && (
                <span className="h-5 w-5 rounded-full bg-[#55C832] dark:bg-[#6BEA45] text-white dark:text-[#0B0F0C] flex items-center justify-center">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>

            <div>
              <div className="text-xs sm:text-sm font-bold text-[#172B4D] dark:text-[#F4F7F2]">
                {opt.label}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5] mt-0.5 leading-relaxed">
                {opt.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
