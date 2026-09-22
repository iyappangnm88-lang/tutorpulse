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
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-900">
              <Compass className="h-3.5 w-3.5 text-indigo-600" />
              Tutor Directory & Marketplace
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
              Discover Expert Educators & Cohorts
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Connect with private tutors using an invite code, or explore public verified teachers offering specialized batches.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enter Invite Code</span>
            </Button>

            <Link href="/tutors">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold gap-1.5 border-gray-200"
              >
                <span>Full Directory</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* In-Portal Tutor Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject, teacher name, or city..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredTutors.length}</span>{' '}
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
                className="flex flex-col justify-between hover:shadow-md transition-shadow border-gray-200"
              >
                <CardBody className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100 shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-snug">
                            {tutor.fullName}
                          </h3>
                          {tutor.locationRegion && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>{tutor.locationRegion}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant={
                          tutor.teachingMode === 'online'
                            ? 'info'
                            : tutor.teachingMode === 'offline'
                            ? 'default'
                            : 'success'
                        }
                        className="text-[10px] capitalize shrink-0"
                      >
                        {tutor.teachingMode === 'both' ? 'Online + Offline' : tutor.teachingMode}
                      </Badge>
                    </div>

                    {tutor.headline && (
                      <p className="text-xs text-gray-700 font-medium line-clamp-2">
                        {tutor.headline}
                      </p>
                    )}

                    {tutor.primarySubjects && tutor.primarySubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tutor.primarySubjects.slice(0, 3).map((sub) => (
                          <span
                            key={sub}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {tutor.publicOfferingCount > 0
                        ? `${tutor.publicOfferingCount} ${
                            tutor.publicOfferingCount === 1 ? 'batch open' : 'batches open'
                          }`
                        : 'Inquiries Open'}
                    </span>

                    <Link href={`/tutors/${tutor.profileSlug}`}>
                      <Button size="sm" className="text-xs gap-1 bg-indigo-600 hover:bg-indigo-700">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {searchQuery ? 'No tutors match your search' : 'No Public Tutors Listed Yet'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'Try searching for another subject or teacher name.'
              : 'If you already have a 6-character invite code from your teacher, click below to join their classroom directly.'}
          </p>
          <div className="pt-2">
            <Button
              onClick={() => setJoinModalOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
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
