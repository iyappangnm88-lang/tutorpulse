import React from 'react'
import { Trophy, Clock, Medal, Crown } from 'lucide-react'
import {
  type GroupLeaderboardTier,
  type StudyGroupMember,
  formatDuration,
} from '@/lib/types/study-groups'

interface GroupLeaderboardProps {
  tiers: GroupLeaderboardTier[]
  rankedMembers: StudyGroupMember[]
  currentUserId: string
}

export function GroupLeaderboard({ tiers, rankedMembers, currentUserId }: GroupLeaderboardProps) {
  const myRankRecord = rankedMembers.find((m) => m.user_id === currentUserId)

  return (
    <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2]">
            Weekly Leaderboard
          </h2>
        </div>

        {myRankRecord && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] border border-emerald-200/60 dark:border-emerald-800/40">
            <span>You: #{myRankRecord.rank}</span>
            <span>•</span>
            <span className="capitalize">{myRankRecord.tier} Tier</span>
          </div>
        )}
      </div>

      {/* Tier Sections */}
      <div className="space-y-4">
        {tiers.map((tierGroup) => {
          if (tierGroup.members.length === 0) return null

          return (
            <div
              key={tierGroup.tier}
              className={`rounded-xl border ${tierGroup.borderLight} ${tierGroup.borderDark} ${tierGroup.bgLight} ${tierGroup.bgDark} p-3.5`}
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: tierGroup.color }}>
                  <span className="text-base">{tierGroup.badge}</span>
                  <span>{tierGroup.label}</span>
                  <span className="text-[10px] opacity-70 font-normal">
                    ({tierGroup.tier === 'gold' ? 'Top 20%' : tierGroup.tier === 'silver' ? 'Next 30%' : 'Remaining 50%'})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-[#A8B3A5]">
                  {tierGroup.members.length} {tierGroup.members.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Members in Tier */}
              <div className="space-y-1.5">
                {tierGroup.members.map((member) => {
                  const isMe = member.user_id === currentUserId
                  const rawName = member.user?.full_name || (isMe ? 'You' : 'Student')
                  const displayName = rawName === 'You' ? (isMe ? 'You' : 'Member') : `${rawName}${isMe ? ' (You)' : ''}`
                  const initial = (rawName || 'S').charAt(0).toUpperCase()

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                        isMe
                          ? 'bg-white dark:bg-[#111711] shadow-2xs ring-1.5 ring-[#55C832] dark:ring-[#6BEA45] font-bold'
                          : 'bg-white/60 dark:bg-[#161D16]/80 hover:bg-white dark:hover:bg-[#111711]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-gray-400 dark:text-gray-500 w-4 text-right">
                          {member.rank}
                        </span>

                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold">
                          {initial}
                        </div>

                        <span className="text-gray-800 dark:text-[#F4F7F2] truncate font-medium">
                          {displayName}
                        </span>

                        {member.role === 'owner' && (
                          <span title="Group Owner">
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                          </span>
                        )}
                        {member.role === 'admin' && (
                          <span title="Group Admin">
                            <Medal className="h-3 w-3 text-emerald-500 shrink-0" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-mono font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{formatDuration(member.weekly_focus_seconds)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
