'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Search,
  UserPlus,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Video,
  BookOpen,
  MapPin,
  Compass,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody } from '@/components/ui/card'
import { JoinTutorModal } from '@/components/student/join-tutor-modal'
import type { PublicTutorSummary } from '@/lib/marketplace-utils'

interface StudentMarketplaceClientProps {
  initialTutors: PublicTutorSummary[]
  totalCount: number
}

export function StudentMarketplaceClient({
  initialTutors,
  totalCount,
}: StudentMarketplaceClientProps) {
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTutors = initialTutors.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      t.fullName.toLowerCase().includes(q) ||
      (t.headline && t.headline.toLowerCase().includes(q)) ||
      t.primarySubjects.some((s) => s.toLowerCase().includes(q)) ||
      (t.locationRegion && t.locationRegion.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Dual Discovery Hero Banner */}
      <div className="rounded-3xl border border-gray-200 dark:border-[#293329] bg-gradient-to-br from-[#FAFBEF] via-white to-violet-50/70 dark:from-[#161D16] dark:via-[#111711] dark:to-[#162414] p-5 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#55C832]/20 px-3 py-1 text-xs font-semibold text-[#172B4D] dark:text-[#6BEA45]">
              <Compass className="h-3.5 w-3.5 text-[#318A25] dark:text-[#6BEA45]" />
              <span>Tutor Directory & Marketplace</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-[#F4F7F2] tracking-tight">
              Discover Expert Educators & Cohorts
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-[#A8B3A5] leading-relaxed">
              Connect with private tutors using an invite code, or explore public verified teachers offering specialized batches.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="bg-[#55C832] hover:bg-[#318A25] text-xs font-bold text-[#0B0F0C] gap-2 shadow-xs min-h-[44px] px-5 rounded-xl cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enter Invite Code</span>
            </Button>

            <Link href="/tutors" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold gap-1.5 border-gray-200 dark:border-[#293329] dark:bg-[#1C261C] dark:text-[#F4F7F2] dark:hover:bg-[#253325] min-h-[44px] px-4 rounded-xl cursor-pointer"
              >
                <span>Full Directory</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400 dark:text-[#A8B3A5]" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* In-Portal Tutor Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-[#A8B3A5]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject, teacher name, or city..."
            className="pl-10 h-11 text-xs rounded-xl bg-white dark:bg-[#161D16] border-gray-200 dark:border-[#293329] text-gray-900 dark:text-[#F4F7F2] placeholder:text-gray-400 dark:placeholder:text-[#A8B3A5]/60"
          />
        </div>

        <div className="text-xs text-gray-500 dark:text-[#A8B3A5]">
          Showing <span className="font-bold text-gray-900 dark:text-[#F4F7F2]">{filteredTutors.length}</span>{' '}
          {filteredTutors.length === 1 ? 'tutor' : 'tutors'}
        </div>
      </div>

      {/* Tutor Cards */}
      {filteredTutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTutors.map((tutor) => {
            const initials = tutor.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <Card
                key={tutor.id}
                className="flex flex-col justify-between hover:shadow-md transition-shadow border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] rounded-2xl overflow-hidden"
              >
                <CardBody className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/tutors/${encodeURIComponent(tutor.profileSlug || tutor.id)}`}
                        className="flex items-center gap-3 group min-w-0"
                      >
                        {tutor.avatarUrl ? (
                          <img
                            src={tutor.avatarUrl}
                            alt={tutor.fullName}
                            className="h-11 w-11 rounded-2xl object-cover border border-gray-200 dark:border-[#293329] shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-2xl bg-[#FAFBEF] dark:bg-[#0B0F0C] text-[#318A25] dark:text-[#6BEA45] font-black text-sm flex items-center justify-center border border-gray-200 dark:border-[#293329] shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2] leading-snug group-hover:text-[#318A25] dark:group-hover:text-[#6BEA45] transition-colors truncate">
                            {tutor.fullName}
                          </h3>
                          {tutor.locationRegion && (
                            <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5] flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="h-3 w-3 text-gray-400 dark:text-[#A8B3A5] shrink-0" />
                              <span className="truncate">{tutor.locationRegion}</span>
                            </p>
                          )}
                        </div>
                      </Link>

                      <Badge
                        variant={
                          tutor.teachingMode === 'online'
                            ? 'info'
                            : tutor.teachingMode === 'offline'
                            ? 'default'
                            : 'success'
                        }
                        className="text-[10px] capitalize shrink-0 font-bold"
                      >
                        {tutor.teachingMode === 'both' ? 'Online + Offline' : tutor.teachingMode}
                      </Badge>
                    </div>

                    {tutor.headline && (
                      <p className="text-xs text-gray-700 dark:text-[#A8B3A5] font-medium line-clamp-2">
                        {tutor.headline}
                      </p>
                    )}

                    {tutor.primarySubjects && tutor.primarySubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tutor.primarySubjects.slice(0, 3).map((sub) => (
                          <span
                            key={sub}
                            className="px-2.5 py-0.5 rounded-lg bg-[#FAFBEF] dark:bg-[#0B0F0C] text-[#318A25] dark:text-[#6BEA45] font-bold text-[10px] border border-gray-200 dark:border-[#293329]"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-gray-100 dark:border-[#293329] flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-[#6BEA45]">
                      {tutor.publicOfferingCount > 0
                        ? `${tutor.publicOfferingCount} ${
                            tutor.publicOfferingCount === 1 ? 'batch open' : 'batches open'
                          }`
                        : 'Inquiries Open'}
                    </span>

                    <Link href={`/tutors/${encodeURIComponent(tutor.profileSlug || tutor.id)}`}>
                      <Button size="sm" className="text-xs gap-1.5 bg-[#55C832] hover:bg-[#318A25] text-[#0B0F0C] font-bold rounded-xl min-h-[38px] px-3.5 cursor-pointer shadow-2xs">
                        <span>View Classes</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] p-8 sm:p-10 text-center space-y-3 shadow-2xs transition-colors">
          <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-[#0B0F0C] text-gray-400 dark:text-[#A8B3A5] flex items-center justify-center mx-auto border border-gray-100 dark:border-[#293329]">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">
            {searchQuery ? 'No tutors match your search' : 'No Public Tutors Listed Yet'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5] max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'Try searching for another subject or teacher name.'
              : 'If you already have a 6-character invite code from your teacher, click below to join their classroom directly.'}
          </p>
          <div className="pt-2">
            <Button
              onClick={() => setJoinModalOpen(true)}
              size="sm"
              className="bg-[#55C832] hover:bg-[#318A25] text-xs font-bold text-[#0B0F0C] gap-1.5 min-h-[44px] px-5 rounded-xl cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enter Invite Code</span>
            </Button>
          </div>
        </div>
      )}

      {/* Join Tutor Modal */}
      <JoinTutorModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  )
}
