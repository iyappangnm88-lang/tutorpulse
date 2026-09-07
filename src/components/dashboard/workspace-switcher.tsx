'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, School, Video, Loader2, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/contexts/workspace-context'
import { cn } from '@/lib/utils'

interface WorkspaceSwitcherProps {
  variant?: 'header' | 'sidebar'
  className?: string
  onSwitch?: () => void
}

export function WorkspaceSwitcher({
  variant = 'header',
  className,
  onSwitch,
}: WorkspaceSwitcherProps) {
  const { workspaceType, switchWorkspace, isPending } = useWorkspace()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelect = async (targetType: 'offline' | 'online') => {
    if (targetType === workspaceType) {
      setOpen(false)
      return
    }
    setOpen(false)
    await switchWorkspace(targetType)
    if (onSwitch) onSwitch()
  }

  const isOffline = workspaceType === 'offline'

  if (variant === 'sidebar') {
    return (
      <div className={cn('px-3 py-2', className)} ref={dropdownRef}>
        <div className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-gray-50/80 to-white p-2.5 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Teaching Workspace
            </span>
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
            ) : (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset',
                  isOffline
                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                )}
              >
                {isOffline ? 'In-Person' : 'Live Virtual'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1 mt-1 bg-gray-100/90 p-1 rounded-lg">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSelect('offline')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-semibold transition-all duration-150',
                isOffline
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              )}
            >
              <School className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Offline</span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSelect('online')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-semibold transition-all duration-150',
                !isOffline
                  ? 'bg-white text-indigo-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              )}
            >
              <Video className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>Online</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default 'header' prominent pill switcher
  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500',
          isOffline
            ? 'bg-amber-50/70 border-amber-200/90 text-amber-950 hover:bg-amber-100/80 hover:border-amber-300'
            : 'bg-indigo-50/80 border-indigo-200/90 text-indigo-950 hover:bg-indigo-100/80 hover:border-indigo-300'
        )}
      >
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-lg shadow-2xs',
            isOffline
              ? 'bg-amber-500 text-white'
              : 'bg-indigo-600 text-white'
          )}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isOffline ? (
            <School className="h-3.5 w-3.5" />
          ) : (
            <Video className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <span className="flex items-center gap-1.5 font-bold tracking-tight">
            {isOffline ? '🏫 Offline Teaching' : '💻 Online Teaching'}
            <span
              className={cn(
                'hidden sm:inline-block rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
                isOffline
                  ? 'bg-amber-200/60 text-amber-800'
                  : 'bg-indigo-200/60 text-indigo-800'
              )}
            >
              {isOffline ? 'Physical' : 'Virtual'}
            </span>
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-gray-500 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 origin-top-right rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Select Teaching Mode
            </p>
            <p className="text-[11px] text-gray-500">
              Each workspace has independent students, batches, and records.
            </p>
          </div>

          {/* Option 1: Offline Teaching */}
          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            onClick={() => handleSelect('offline')}
            className={cn(
              'w-full flex items-start gap-3 rounded-xl p-2.5 text-left transition-colors',
              isOffline
                ? 'bg-amber-50/80 border border-amber-200/70 text-amber-950'
                : 'hover:bg-gray-50 text-gray-800'
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs',
                isOffline
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-700'
              )}
            >
              <School className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">🏫 Offline Teaching</span>
                {isOffline && <Check className="h-4 w-4 text-amber-700" />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Physical classrooms, classroom locations, in-person attendance & chalkboard notes.
              </p>
            </div>
          </button>

          {/* Option 2: Online Teaching */}
          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            onClick={() => handleSelect('online')}
            className={cn(
              'w-full flex items-start gap-3 rounded-xl p-2.5 text-left transition-colors mt-1',
              !isOffline
                ? 'bg-indigo-50/80 border border-indigo-200/70 text-indigo-950'
                : 'hover:bg-gray-50 text-gray-800'
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs',
                !isOffline
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              )}
            >
              <Video className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">💻 Online Teaching</span>
                {!isOffline && <Check className="h-4 w-4 text-indigo-700" />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                WebRTC live video, screen sharing, live chat, digital batches & calendar.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
