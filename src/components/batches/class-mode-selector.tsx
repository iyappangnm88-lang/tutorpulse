'use client'

import React from 'react'
import { Building2, Video, Globe2, MapPin } from 'lucide-react'
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
  const modes: Array<{
    id: ClassMode
    title: string
    subtitle: string
    icon: React.ElementType
  }> = [
    {
      id: 'offline',
      title: 'Offline',
      subtitle: 'In-person classroom',
      icon: Building2,
    },
    {
      id: 'online',
      title: 'Online',
      subtitle: 'Live video class',
      icon: Video,
    },
    {
      id: 'hybrid',
      title: 'Hybrid',
      subtitle: 'In-person & online',
      icon: Globe2,
    },
  ]

  const isLocationApplicable = mode === 'offline' || mode === 'hybrid'

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-sm font-semibold text-gray-900">
          Class Mode <span className="text-red-500">*</span>
        </span>
        <p className="text-xs text-gray-500">
          How students attend classes for this batch.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
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
                'flex items-center sm:flex-col sm:items-center sm:text-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-left',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50 min-h-[52px]',
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-semibold ring-1 ring-indigo-600 shadow-2xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/60'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors',
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div>
                <span className="block text-xs font-bold leading-tight">
                  {item.title}
                </span>
                <span className="block text-[11px] text-gray-500 font-normal mt-0.5">
                  {item.subtitle}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Conditional Location Input */}
      {isLocationApplicable && (
        <div className="pt-2 animate-fade-in">
          <label
            htmlFor="class_location"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Class Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="class_location"
              type="text"
              placeholder="e.g. Anna Nagar Tuition Centre, Room 102"
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
          <p className="text-[11px] text-gray-400 mt-1">
            Physical classroom address or room number. Helpful for parents and students.
          </p>
          {locationError && (
            <p className="text-xs font-medium text-red-600 mt-1" role="alert">
              {locationError}
            </p>
          )}
        </div>
      )}

      {mode === 'online' && (
        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-800 flex items-start gap-2 animate-fade-in">
          <Video className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            Online classes do not require a physical location. In a future Phase 2 update, your online classroom video link will be generated automatically for this batch.
          </p>
        </div>
      )}
    </div>
  )
}
