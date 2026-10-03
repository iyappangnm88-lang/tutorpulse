'use client'

import React from 'react'

interface StudentGamificationStripProps {
  xp: number
  goldCoins: number
  streakCount?: number
  streakWeeks?: number
  className?: string
}

export function StudentGamificationStrip({
  xp = 0,
  goldCoins = 0,
  streakCount = 1,
  streakWeeks = 0,
  className = '',
}: StudentGamificationStripProps) {
  const displayStreak = streakWeeks > 0 ? `${streakWeeks}w` : `${streakCount}d`
  const streakTitle = streakWeeks > 0 ? `${streakWeeks} consecutive active weeks` : `${streakCount} consecutive active days`

  return (
    <section
      aria-label="Student Learning Progress and Rewards"
      className={`grid grid-cols-3 gap-2.5 sm:gap-4 p-3 sm:p-3.5 bg-white dark:bg-[#161D16] rounded-2xl border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors ${className}`}
    >
      {/* 1. XP (Experience Points) */}
      <div
        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100/80 dark:border-violet-900/40 transition-colors"
        aria-label={`Experience Points: ${xp.toLocaleString()} XP`}
      >
        <div
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-violet-100/90 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 flex items-center justify-center text-sm sm:text-base shrink-0 font-bold shadow-2xs"
          aria-hidden="true"
        >
          ⚡
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-violet-900/80 dark:text-violet-400 uppercase tracking-wider block leading-tight">
            XP
          </span>
          <div className="text-sm sm:text-base font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight truncate leading-tight mt-0.5">
            {xp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. Gold Coins */}
      <div
        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100/80 dark:border-amber-900/40 transition-colors"
        aria-label={`Gold Coins: ${goldCoins.toLocaleString()} Coins`}
      >
        <div
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-100/90 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm sm:text-base shrink-0 font-bold shadow-2xs"
          aria-hidden="true"
        >
          🪙
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-amber-900/80 dark:text-amber-400 uppercase tracking-wider block leading-tight">
            Coins
          </span>
          <div className="text-sm sm:text-base font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight truncate leading-tight mt-0.5">
            {goldCoins.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3. Streak */}
      <div
        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100/80 dark:border-orange-900/40 transition-colors"
        title={streakTitle}
        aria-label={`Active Streak: ${displayStreak}`}
      >
        <div
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-orange-100/90 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 flex items-center justify-center text-sm sm:text-base shrink-0 font-bold shadow-2xs"
          aria-hidden="true"
        >
          🔥
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-orange-900/80 dark:text-orange-400 uppercase tracking-wider block leading-tight">
            Streak
          </span>
          <div className="text-sm sm:text-base font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight truncate leading-tight mt-0.5">
            {displayStreak}
          </div>
        </div>
      </div>
    </section>
  )
}
