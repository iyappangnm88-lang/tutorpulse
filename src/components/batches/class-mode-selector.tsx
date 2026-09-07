'use client'

import React from 'react'
import { Building2, Video, MapPin, AlertCircle } from 'lucide-react'
import type { ClassMode } from '@/types'
import { cn } from '@/lib/utils'

interface ClassModeSelectorProps {
  mode: ClassMode
  location: string
  onModeChange: (mode: ClassMode) => void
  onLocationChange: (location: string) => void
  locationError?: string
  disabled?: boolean
}

export function ClassModeSelector({
  mode,
  location,
  onModeChange,
  onLocationChange,
  locationError,
  disabled = false,
}: ClassModeSelectorProps) {
  // TutorPulse strictly offers two distinct teaching systems: Offline (Physical) or Online (Virtual)
  const modes: Array<{
    id: 'offline' | 'online'
    title: string
    subtitle: string
    icon: React.ElementType
  }> = [
    {
      id: 'offline',
      title: 'Offline Physical Class',
      subtitle: 'In-person tuition at a physical location',
      icon: Building2,
    },
    {
      id: 'online',
      title: 'Online Virtual Classroom',
      subtitle: 'WebRTC video, screen share & live chat',
      icon: Video,
    },
  ]

  const isOffline = mode === 'offline'
  const isOnline = mode === 'online'
  const isLegacyHybrid = mode === 'hybrid'

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-sm font-semibold text-gray-900">
          Teaching System / Class Mode <span className="text-red-500">*</span>
        </span>
        <p className="text-xs text-gray-500">
          Select whether this batch is taught in person at a physical location or conducted in the online virtual classroom.
        </p>
      </div>

      {/* Legacy Hybrid Notice (if existing batch previously used hybrid) */}
      {isLegacyHybrid && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            This batch is currently using legacy <strong>Hybrid</strong> mode. Please select either <strong>Offline Physical Class</strong> or <strong>Online Virtual Classroom</strong> to separate the teaching experience.
          </p>
        </div>
      )}

      {/* 2-Option Mode Selection Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-label="Select class mode"
      >
        {modes.map((item) => {
          const isSelected = mode === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onModeChange(item.id)}
              className={cn(
                'flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50 min-h-[64px]',
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-semibold ring-1 ring-indigo-600 shadow-2xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/60'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors',
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight text-gray-900">
                  {item.title}
                </span>
                <span className="block text-[11px] text-gray-500 font-normal mt-0.5 leading-snug">
                  {item.subtitle}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 1. Offline Physical Location (Only shown for Offline batches) */}
      {(isOffline || isLegacyHybrid) && (
        <div className="pt-1 animate-fade-in">
          <label
            htmlFor="class_location"
            className="block text-xs font-semibold text-gray-800 mb-1"
          >
            Physical Classroom Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="class_location"
              type="text"
              placeholder="e.g. Anna Nagar Tuition Center, Room 102"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-sm text-gray-900 shadow-2xs transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                'disabled:opacity-50 disabled:bg-gray-50 min-h-[44px]',
                locationError ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
              )}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Physical classroom address, landmark, or room number for students and parents.
          </p>
          {locationError && (
            <p className="text-xs font-medium text-red-600 mt-1" role="alert">
              {locationError}
            </p>
          )}
        </div>
      )}

      {/* 2. Online Virtual Classroom Info Banner (Only shown for Online batches) */}
      {isOnline && (
        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5 animate-fade-in">
          <Video className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-semibold text-indigo-950">
              Online Virtual Classroom Enabled
            </p>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              No physical address needed. Classes for this batch will launch in TutorPulse&apos;s integrated WebRTC classroom with video, microphone, screen sharing, and interactive class chat.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
