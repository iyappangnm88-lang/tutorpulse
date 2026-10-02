'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, Sparkles } from 'lucide-react'
import type { StudyGroup } from '@/lib/types/study-groups'
import { StudyGroupCard } from './study-group-card'
import { joinStudyGroupAction } from '@/app/student/study-groups/actions'
import { useRouter } from 'next/navigation'

interface StudyGroupsHomeClientProps {
  myGroups: StudyGroup[]
  discoverGroups: StudyGroup[]
}

export function StudyGroupsHomeClient({
  myGroups,
  discoverGroups,
}: StudyGroupsHomeClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'popular' | 'recommended' | 'new'>('popular')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  async function handleJoinGroup(groupId: string) {
    setJoiningId(groupId)
    const res = await joinStudyGroupAction(groupId)
    setJoiningId(null)
    if (res.success) {
      if (res.data?.status === 'joined') {
        router.push(`/student/study-groups/${groupId}`)
      } else {
        router.refresh()
      }
    } else {
      alert(res.error || 'Failed to join group')
    }
  }

  const filteredDiscover = discoverGroups
    .filter((g) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        g.name.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.class_or_exam.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (filterTab === 'popular') {
        return b.member_count - a.member_count || b.weekly_focus_seconds - a.weekly_focus_seconds
      }
      if (filterTab === 'recommended') {
        return b.weekly_focus_seconds - a.weekly_focus_seconds || b.member_count - a.member_count
      }
      if (filterTab === 'new') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return 0
    })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200/80 dark:border-[#293329] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight flex items-center gap-2.5">
            Study Groups
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#55C832]/15 text-[#318A25] dark:text-[#6BEA45] border border-[#55C832]/30">
              Community Focus
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-1">
            Study together, track live focus sessions, compete on weekly leaderboards, and achieve your goals.
          </p>
        </div>

        <Link
          href="/student/study-groups/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-2xs transition-all duration-150 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create</span>
        </Link>
      </div>

      {/* SECTION 1: MY GROUPS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#202920] pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2]">
              My Groups ({myGroups.length})
            </h2>
          </div>
        </div>

        {myGroups.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-dashed border-gray-300 dark:border-[#293329] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#55C832]/10 text-[#318A25] dark:text-[#6BEA45] mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172B4D] dark:text-[#F4F7F2]">
              You haven&apos;t joined any study groups yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-1 max-w-sm mx-auto">
              Join a group below or create your own study group with friends and classmates!
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/student/study-groups/new"
                className="px-4 py-2 rounded-xl bg-[#55C832] text-white text-xs font-bold hover:bg-[#318A25] transition-all shadow-2xs"
              >
                + Create Study Group
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <StudyGroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: DISCOVER GROUPS */}
      <section className="space-y-4 pt-2">
        <div className="space-y-3 border-b border-gray-100 dark:border-[#202920] pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2]">
                Discover Groups
              </h2>
            </div>

            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] pl-9 pr-3.5 py-2 text-xs text-[#172B4D] dark:text-[#F4F7F2] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#55C832]"
              />
            </div>
          </div>

          {/* Filter Chips: Popular | Recommended | New */}
          <div className="flex items-center gap-2">
            {(['popular', 'recommended', 'new'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterTab === tab
                    ? 'bg-[#55C832] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#202920]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredDiscover.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-8 text-center text-gray-400">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No matching study groups found
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Try searching with different keywords or create a new group!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiscover.map((group) => (
              <StudyGroupCard
                key={group.id}
                group={group}
                onJoin={handleJoinGroup}
                isJoining={joiningId === group.id}
                showActions
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
