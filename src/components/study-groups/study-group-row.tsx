import React from 'react'
import Link from 'next/link'
import { Users, Clock, Flame, Shield, Lock, Globe, ArrowRight } from 'lucide-react'
import { type StudyGroup, formatDuration } from '@/lib/types/study-groups'

interface StudyGroupRowProps {
  group: StudyGroup
  onJoin?: (groupId: string) => void
  isJoining?: boolean
  showActions?: boolean
}

export function StudyGroupRow({
  group,
  onJoin,
  isJoining = false,
  showActions = false,
}: StudyGroupRowProps) {
  const isMember = Boolean(group.my_role)
  const isPending = group.my_request_status === 'pending'
  const isFull = group.member_count >= group.max_members

  const displayDescription = group.description?.trim() || group.group_goal?.trim() || 'No description provided'

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] hover:border-[#55C832]/50 dark:hover:border-[#6BEA45]/50 transition-all duration-200 shadow-2xs hover:shadow-xs">
      {/* Left Content Area: Title, Badges, Class/Topic, and 1-line description */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Title and Prominent Class / Topic */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/student/study-groups/${group.id}`}
            className="text-sm font-bold text-[#172B4D] dark:text-[#F4F7F2] group-hover:text-[#318A25] dark:group-hover:text-[#6BEA45] transition-colors truncate"
          >
            {group.name}
          </Link>

          {/* Prominent Class / Topic badge */}
          {group.class_or_exam && group.class_or_exam !== 'General' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAFBEF] dark:bg-[#202920] text-[#318A25] dark:text-[#6BEA45] border border-gray-200/80 dark:border-[#293329]">
              {group.class_or_exam}
            </span>
          )}

          {/* Subject badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] border border-emerald-200/60 dark:border-emerald-800/40">
            {group.subject}
          </span>
        </div>

        {/* 1-Line Truncated Description / Goal (YouTube search result style) */}
        <p className="text-xs text-gray-500 dark:text-[#A8B3A5] truncate max-w-2xl">
          {displayDescription}
        </p>

        {/* Compact Metadata Row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-[#89958C] flex-wrap pt-0.5">
          {/* Visibility */}
          <span className="inline-flex items-center gap-1 font-medium">
            {group.visibility === 'public' ? (
              <>
                <Globe className="h-3 w-3 text-emerald-500" />
                <span>Public</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-amber-500" />
                <span>Private</span>
              </>
            )}
          </span>

          <span>•</span>

          {/* Member Count */}
          <span className="inline-flex items-center gap-1 font-medium">
            <Users className="h-3 w-3 text-gray-400 dark:text-[#6C7A6A]" />
            <span>
              {group.member_count}/{group.max_members} members
            </span>
          </span>

          <span>•</span>

          {/* Weekly Focus Time */}
          <span className="inline-flex items-center gap-1 font-medium" title="Weekly Focus Time">
            <Clock className="h-3 w-3 text-[#55C832] dark:text-[#6BEA45]" />
            <span>{formatDuration(group.weekly_focus_seconds)} focused this week</span>
          </span>

          {/* Live indicator if anyone focusing */}
          {group.live_focus_count > 0 && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400">
                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                <span>{group.live_focus_count} focusing now</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Content Area: Action Button / Status */}
      <div className="flex items-center sm:self-center shrink-0 pt-1 sm:pt-0">
        {isMember ? (
          <Link
            href={`/student/study-groups/${group.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#318A25] dark:text-[#6BEA45] text-xs font-bold transition-all border border-emerald-200/60 dark:border-emerald-800/40"
          >
            <span>Open</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : isPending ? (
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Requested
          </span>
        ) : isFull ? (
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 dark:bg-[#202920] dark:text-gray-500">
            Full
          </span>
        ) : onJoin ? (
          <button
            type="button"
            disabled={isJoining}
            onClick={() => onJoin(group.id)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isJoining ? 'Joining...' : group.visibility === 'private' ? 'Request to Join' : 'Join Group'}
          </button>
        ) : (
          <Link
            href={`/student/study-groups/${group.id}`}
            className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1C261C] hover:bg-[#55C832]/15 text-[#172B4D] dark:text-[#F4F7F2] text-xs font-bold transition-all"
          >
            View
          </Link>
        )}
      </div>
    </div>
  )
}
