import React from 'react'
import Link from 'next/link'
import { Users, Clock, Flame, Shield, Lock, Globe, ArrowRight } from 'lucide-react'
import { type StudyGroup, formatDuration } from '@/lib/types/study-groups'

interface StudyGroupCardProps {
  group: StudyGroup
  onJoin?: (groupId: string) => void
  isJoining?: boolean
  showActions?: boolean
}

export function StudyGroupCard({
  group,
  onJoin,
  isJoining = false,
  showActions = false,
}: StudyGroupCardProps) {
  const isMember = Boolean(group.my_role)
  const isPending = group.my_request_status === 'pending'
  const isFull = group.member_count >= group.max_members

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:border-[#55C832]/40 dark:hover:border-[#6BEA45]/40">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#55C832]/10 dark:bg-[#6BEA45]/15 text-[#318A25] dark:text-[#6BEA45] border border-[#55C832]/20 dark:border-[#6BEA45]/30">
              {group.subject}
            </span>
            {group.class_or_exam && group.class_or_exam !== 'General' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5]">
                {group.class_or_exam}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {group.visibility === 'private' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#1C261C] px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-800">
                <Lock className="h-2.5 w-2.5" /> Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40">
                <Globe className="h-2.5 w-2.5" /> Public
              </span>
            )}

            {group.my_role && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                <Shield className="h-2.5 w-2.5" /> {group.my_role}
              </span>
            )}
          </div>
        </div>

        {/* Group Name & Description */}
        <Link href={`/student/study-groups/${group.id}`} className="block group-hover:text-[#318A25] dark:group-hover:text-[#6BEA45] transition-colors">
          <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F4F7F2] line-clamp-1">
            {group.name}
          </h3>
        </Link>
        {group.description ? (
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
            {group.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 italic min-h-[32px]">
            No description provided.
          </p>
        )}

        {/* Goal Banner if any */}
        {group.group_goal && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-[11px] text-amber-800 dark:text-amber-300 line-clamp-1 font-medium flex items-center gap-1.5">
            <span>🎯</span> <span className="truncate">Goal: {group.group_goal}</span>
          </div>
        )}
      </div>

      {/* Stats & Footer */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-[#202920] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-gray-500 dark:text-[#A8B3A5]">
          <span className="flex items-center gap-1 font-medium">
            <Users className="h-3.5 w-3.5 text-gray-400 dark:text-[#6C7A6A]" />
            {group.member_count}/{group.max_members}
          </span>
          <span className="flex items-center gap-1 font-medium" title="Weekly Focus Time">
            <Clock className="h-3.5 w-3.5 text-[#55C832] dark:text-[#6BEA45]" />
            {formatDuration(group.weekly_focus_seconds)}
          </span>
          {group.live_focus_count > 0 && (
            <span className="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 animate-pulse">
              <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
              {group.live_focus_count} live
            </span>
          )}
        </div>

        <div>
          {isMember ? (
            <Link
              href={`/student/study-groups/${group.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#318A25] dark:text-[#6BEA45] hover:underline"
            >
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : isPending ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Requested
            </span>
          ) : isFull ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 dark:bg-[#202920] dark:text-gray-500">
              Full
            </span>
          ) : onJoin ? (
            <button
              type="button"
              disabled={isJoining}
              onClick={() => onJoin(group.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {group.visibility === 'private' ? 'Request' : 'Join'}
            </button>
          ) : (
            <Link
              href={`/student/study-groups/${group.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#1C261C] hover:bg-[#55C832]/15 text-[#172B4D] dark:text-[#F4F7F2] text-xs font-bold transition-all"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
