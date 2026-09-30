'use client'

import React from 'react'
import Link from 'next/link'
import {
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Layers,
  ChevronRight,
  Smile,
  Heart,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTimeRange } from '@/lib/scheduling'
import type { ProfileTemplateProps } from './types'

export function TemplateCreative({
  tutorDetail,
  currentUser,
  isOwner,
  requestMap,
  portalHref,
  onRequestJoin,
}: ProfileTemplateProps) {
  const { profile, offerings } = tutorDetail

  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-10 animate-fade-in font-sans">
      {/* Creative Hero Card with playful warm gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 p-1 sm:p-1.5 shadow-lg">
        <div className="rounded-[22px] bg-white p-6 sm:p-10 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 sm:gap-8">
            {/* Friendly Avatar with warm ring */}
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover ring-4 ring-orange-200 shadow-md rotate-[-2deg] hover:rotate-0 transition-transform"
                />
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 text-white font-black text-3xl sm:text-4xl flex items-center justify-center ring-4 ring-orange-200 shadow-md rotate-[-2deg]">
                  {initials}
                </div>
              )}
              <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold inline-flex items-center gap-1">
                  <Smile className="h-3.5 w-3.5 text-orange-600" />
                  <span>Passionate Mentor</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold capitalize">
                  {profile.teachingMode === 'both' ? 'Online + Offline' : profile.teachingMode}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Hey, I'm {profile.fullName}! 👋
              </h1>

              {profile.headline && (
                <p className="text-base sm:text-lg font-medium text-neutral-700 leading-snug">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-neutral-500 pt-1">
                {profile.locationRegion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                    <span>Based in {profile.locationRegion}</span>
                  </span>
                )}
                {profile.experienceYears > 0 && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-rose-500" />
                    <span>{profile.experienceYears} Years Guiding Learners</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified Tutor</span>
                </span>
              </div>
            </div>
          </div>

          {/* Creative Subject Badges */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-center md:justify-start gap-2">
            {profile.primarySubjects.map((sub, i) => {
              const colors = [
                'bg-amber-100 text-amber-900 border-amber-200',
                'bg-rose-100 text-rose-900 border-rose-200',
                'bg-orange-100 text-orange-900 border-orange-200',
                'bg-emerald-100 text-emerald-900 border-emerald-200',
                'bg-sky-100 text-sky-900 border-sky-200',
              ]
              const color = colors[i % colors.length]

              return (
                <span
                  key={sub}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold border shadow-xs ${color}`}
                >
                  {sub}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Style & Approach */}
        <div className="space-y-6 lg:col-span-1">
          {profile.teachingApproach && (
            <div className="rounded-3xl border border-orange-200 bg-orange-50/60 p-6 space-y-3">
              <h3 className="text-sm font-bold text-orange-950 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span>How I Teach & Inspire</span>
              </h3>
              <p className="text-xs sm:text-sm text-orange-900 leading-relaxed font-medium">
                "{profile.teachingApproach}"
              </p>
            </div>
          )}

          {profile.bio && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <span>About My Classroom</span>
              </h3>
              <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </div>
            </div>
          )}

          {profile.availabilityHours.length > 0 && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Class Times & Availability</span>
              </h3>
              <div className="space-y-2 text-xs">
                {profile.availabilityHours.map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-50"
                  >
                    <span className="font-bold text-neutral-700 capitalize">{slot.day}</span>
                    <span className="text-neutral-500 font-mono text-[11px]">
                      {formatTimeRange(slot.start_time, slot.end_time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Batches */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-neutral-900">Explore Active Classes 🚀</h2>
              <p className="text-xs text-neutral-500">
                Join our learning squad! Request a spot in an ongoing or upcoming cohort.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-black">
              {offerings.length} Cohorts
            </span>
          </div>

          {offerings.length > 0 ? (
            <div className="space-y-4">
              {offerings.map((batch) => {
                const reqStatus = requestMap.get(batch.id)

                return (
                  <div
                    key={batch.id}
                    className="rounded-3xl border border-neutral-200 bg-white p-6 hover:shadow-md hover:border-orange-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-neutral-900">
                            {batch.batchName}
                          </h3>
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                            {batch.classMode}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-600">
                          {batch.subject && (
                            <span className="font-bold text-neutral-800 flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-orange-500" />
                              <span>{batch.subject}</span>
                            </span>
                          )}
                          {batch.className && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                              <span>{batch.className}</span>
                            </span>
                          )}
                          {batch.schedule && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                              <span>{batch.schedule}</span>
                            </span>
                          )}
                          {batch.startTime && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-500">
                              <Clock className="h-3.5 w-3.5 text-neutral-400" />
                              <span>{formatTimeRange(batch.startTime, batch.endTime)}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-bold text-orange-900 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            {batch.pricingRate != null ? (
                              <>₹{batch.pricingRate} <span className="text-[10px] font-medium text-orange-700">/{batch.pricingUnit ? batch.pricingUnit.replace('per_', '') : 'month'}</span></>
                            ) : (
                              <span className="text-neutral-500 font-medium">Pricing not set</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 pt-2 sm:pt-0">
                        {reqStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 px-3.5 py-2 rounded-2xl">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Request Pending</span>
                          </span>
                        ) : reqStatus === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-100 px-3.5 py-2 rounded-2xl">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>You're Enrolled!</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => onRequestJoin(batch)}
                            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-2xl gap-1 shadow-md"
                          >
                            <span>Join Squad</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {(batch.publicDescription || batch.description) && (
                      <div className="pt-3 border-t border-neutral-100 text-xs text-neutral-600 leading-relaxed">
                        {batch.publicDescription || batch.description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center space-y-3">
              <Layers className="h-6 w-6 text-neutral-400 mx-auto" />
              <h4 className="font-bold text-base text-neutral-900">New Batches Dropping Soon!</h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Classes are being scheduled right now. Ping the tutor directly to secure an early invite.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
