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
      className={`grid grid-cols-3 gap-2 sm:gap-3.5 p-2 sm:p-2.5 bg-white dark:bg-[#161D16] rounded-2xl border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors ${className}`}
    >
      {/* 1. XP (Experience Points) */}
      <div
        className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100/80 dark:border-violet-900/40 transition-colors"
        aria-label={`Experience Points: ${xp.toLocaleString()} XP`}
      >
        <div
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-violet-100/90 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs sm:text-sm shrink-0 font-bold shadow-2xs"
          aria-hidden="true"
        >
          ⚡
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-violet-900/70 dark:text-violet-400 uppercase tracking-wider block leading-tight">
            XP
          </span>
          <div className="text-xs sm:text-sm font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight truncate leading-tight mt-0.5">
            {xp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. Gold Coins */}
      <div
        className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40 transition-colors"
        aria-label={`Gold Coins: ${goldCoins.toLocaleString()} Coins`}
      >
        <div
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-100/90 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs sm:text-sm shrink-0 font-bold shadow-2xs"
          aria-hidden="true"
        >
          🪙
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-900/70 dark:text-amber-400 uppercase tracking-wider block leading-tight">
            Coins
          </span>
          <div className="text-xs sm:text-sm font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight truncate leading-tight mt-0.5">
            {goldCoins.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3. Streak */}
      <div
        className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100/80 dark:border-orange-900/40 transition-colors"
        title={streakTitle}
        aria-label={`Active Streak: ${displayStreak}`}
      >
        <div
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-100/90 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 flex items-center justify-center text-xs sm:text-sm shrink-0 font-bold shadow-2xs"
          aria-hidden="true"
        >
          🔥
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-orange-900/70 dark:text-orange-400 uppercase tracking-wider block leading-tight">
            Streak
          </span>
          <div className="text-xs sm:text-sm font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight truncate leading-tight mt-0.5">
            {displayStreak}
          </div>
        </div>
      </div>
    </section>
  )
}
