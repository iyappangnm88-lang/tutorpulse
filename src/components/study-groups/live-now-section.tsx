import React from 'react'
import { Flame, Clock, Radio } from 'lucide-react'
import { type StudyGroupLiveUser, formatDuration } from '@/lib/types/study-groups'

interface LiveNowSectionProps {
  liveUsers: StudyGroupLiveUser[]
  onStartFocus: () => void
}

export function LiveNowSection({ liveUsers, onStartFocus }: LiveNowSectionProps) {
  const activeUsers = liveUsers.filter((u) => !u.is_paused)

  return (
    <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3 items-center justify-center">
            {activeUsers.length > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                activeUsers.length > 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2] flex items-center gap-2">
            Live Now
            {activeUsers.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] border border-emerald-200/60 dark:border-emerald-800/40 normal-case">
                {activeUsers.length} {activeUsers.length === 1 ? 'student' : 'students'} focusing
              </span>
            )}
          </h2>
        </div>

        <button
          type="button"
          onClick={onStartFocus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <Flame className="h-3.5 w-3.5 fill-white" />
          <span>Join Focus Room</span>
        </button>
      </div>

      {/* Body */}
      {activeUsers.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl bg-gray-50/70 dark:bg-[#111711]/60 border border-dashed border-gray-200 dark:border-[#293329]">
          <Radio className="h-6 w-6 text-gray-400 dark:text-gray-600 mx-auto mb-2 opacity-70" />
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            No one is focusing right now
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
            Start a focus session and inspire your study group!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeUsers.map((liveUser) => {
            const name = liveUser.user?.full_name || 'Student'
            const initial = name.charAt(0).toUpperCase()
            return (
              <div
                key={liveUser.id}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 transition-all hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#318A25] to-[#55C832] text-white text-xs font-bold shadow-2xs">
                      {initial}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#161D16]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] truncate">
                      {name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-[#A8B3A5] truncate">
                      {liveUser.subject || 'General Focus'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-[#318A25] dark:text-[#6BEA45] bg-white/80 dark:bg-[#111711] px-2 py-1 rounded-lg shadow-2xs shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                  <Clock className="h-3 w-3 text-[#55C832]" />
                  <span>{formatDuration(liveUser.duration_seconds)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
