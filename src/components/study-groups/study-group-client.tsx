'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Clock,
  Flame,
  Shield,
  Lock,
  Globe,
  Settings,
  ArrowLeft,
  LogOut,
  Target,
} from 'lucide-react'
import {
  type StudyGroup,
  type StudyGroupMember,
  type GroupLeaderboardTier,
  type StudyGroupLiveUser,
  type StudyGroupMessage,
  type StudyGroupJoinRequest,
  formatDuration,
} from '@/lib/types/study-groups'
import { LiveNowSection } from './live-now-section'
import { GroupLeaderboard } from './group-leaderboard'
import { GroupChat } from './group-chat'
import { GroupSettingsModal } from './group-settings-modal'
import { joinStudyGroupAction, leaveStudyGroupAction } from '@/app/student/study-groups/actions'

interface StudyGroupClientProps {
  group: StudyGroup
  members: StudyGroupMember[]
  rankedMembers: StudyGroupMember[]
  tiers: GroupLeaderboardTier[]
  myMemberRecord: StudyGroupMember | null
  myRole: 'owner' | 'admin' | 'member' | null
  myRequestStatus: 'pending' | 'approved' | 'rejected' | null
  liveUsers: StudyGroupLiveUser[]
  messages: StudyGroupMessage[]
  messageCountToday: number
  messageDailyLimit: number
  joinRequests: StudyGroupJoinRequest[]
  currentUserId: string
}

export function StudyGroupClient({
  group,
  members,
  rankedMembers,
  tiers,
  myMemberRecord,
  myRole,
  myRequestStatus,
  liveUsers,
  messages,
  messageCountToday,
  messageDailyLimit,
  joinRequests,
  currentUserId,
}: StudyGroupClientProps) {
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const isMember = !!myRole
  const isPending = myRequestStatus === 'pending'
  const isOwnerOrAdmin = myRole === 'owner' || myRole === 'admin'

  async function handleJoin() {
    setIsJoining(true)
    const res = await joinStudyGroupAction(group.id)
    setIsJoining(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || 'Failed to join group')
    }
  }

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this study group?')) return
    setIsLeaving(true)
    const res = await leaveStudyGroupAction(group.id)
    setIsLeaving(false)
    if (res.success) {
      router.push('/student/study-groups')
      router.refresh()
    } else {
      alert(res.error || 'Failed to leave group')
    }
  }

  function handleStartFocus() {
    router.push(`/student?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)
  }

  return (
    <div className="space-y-6 pb-16 lg:pb-0 animate-in fade-in duration-300">
      {/* Back Button */}
      <div>
        <Link
          href="/student/study-groups"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Groups
        </Link>
      </div>

      {/* Main Group Header Card */}
      <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#55C832]/15 text-[#318A25] dark:text-[#6BEA45] border border-[#55C832]/30">
                {group.subject}
              </span>
              {group.class_or_exam && group.class_or_exam !== 'General' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#1C261C] text-gray-700 dark:text-gray-300">
                  {group.class_or_exam}
                </span>
              )}
              {group.visibility === 'private' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-[#1C261C] px-2.5 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" /> Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  <Globe className="h-3 w-3" /> Public
                </span>
              )}
              {myRole && (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                  <Shield className="h-3 w-3" /> {myRole}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-xs text-gray-600 dark:text-[#A8B3A5] max-w-2xl leading-relaxed">
                {group.description}
              </p>
            )}

            {group.group_goal && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <span>🎯</span>
                <span>Goal: {group.group_goal}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {isMember ? (
              <>
                <button
                  type="button"
                  onClick={handleStartFocus}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Target className="h-4 w-4" />
                  <span>Start Group Focus</span>
                </button>

                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#1C261C] hover:bg-gray-200 dark:hover:bg-[#253325] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Group Settings & Members"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  disabled={isLeaving}
                  onClick={handleLeave}
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#1C261C] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-gray-500 transition-colors cursor-pointer"
                  title="Leave Group"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : isPending ? (
              <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">
                Join Request Pending
              </div>
            ) : (
              <button
                type="button"
                disabled={isJoining}
                onClick={handleJoin}
                className="px-5 py-2.5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {group.visibility === 'private' ? 'Request to Join Group' : 'Join Group'}
              </button>
            )}
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-[#202920] flex items-center gap-6 text-xs text-gray-500 dark:text-[#A8B3A5]">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="h-4 w-4 text-gray-400" />
            <span>
              <strong className="text-[#172B4D] dark:text-[#F4F7F2]">{group.member_count}</strong>/{group.max_members} members
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="h-4 w-4 text-[#55C832]" />
            <span>
              <strong className="text-[#172B4D] dark:text-[#F4F7F2]">{formatDuration(group.weekly_focus_seconds)}</strong> focused this week
            </span>
          </div>
          {group.live_focus_count > 0 && (
            <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400 animate-pulse">
              <Flame className="h-4 w-4 fill-orange-500" />
              <span>{group.live_focus_count} focusing now</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Main Left Column (Live Now + Leaderboard) and Right Column (Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          <LiveNowSection liveUsers={liveUsers} onStartFocus={handleStartFocus} />

          <GroupLeaderboard
            tiers={tiers}
            rankedMembers={rankedMembers}
            currentUserId={currentUserId}
          />
        </div>

        {/* Right 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          <GroupChat
            groupId={group.id}
            initialMessages={messages}
            messageCountToday={messageCountToday}
            messageDailyLimit={messageDailyLimit}
            isMember={isMember}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <GroupSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        group={group}
        members={members}
        joinRequests={joinRequests}
        currentUserId={currentUserId}
        myRole={myRole}
      />
    </div>
  )
}
