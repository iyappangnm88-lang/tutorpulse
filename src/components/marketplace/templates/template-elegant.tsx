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
  ShieldCheck,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody } from '@/components/ui/card'
import { formatTimeRange } from '@/lib/scheduling'
import type { ProfileTemplateProps } from './types'

export function TemplateElegant({
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
    <div className="space-y-12 animate-fade-in">
      {/* Elegant Hero Presentation */}
      <div className="relative rounded-3xl border border-stone-200 bg-gradient-to-b from-[#FAF8F5] via-white to-[#FDFBF7] p-8 sm:p-12 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
          {/* Avatar with subtle gold ring */}
          <div className="relative">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-amber-100 shadow-md ring-1 ring-stone-200"
              />
            ) : (
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-stone-800 to-stone-700 text-amber-200 font-serif font-bold text-3xl flex items-center justify-center shadow-md border-4 border-amber-100">
                {initials}
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-stone-900 text-amber-300 p-1.5 rounded-full shadow-md">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-serif tracking-widest uppercase">
              <span>Distinguished Educator</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 tracking-tight">
              {profile.fullName}
            </h1>

            {profile.headline && (
              <p className="text-base sm:text-lg font-serif italic text-stone-600 max-w-2xl mx-auto leading-relaxed">
                "{profile.headline}"
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500 pt-2 font-sans">
              {profile.locationRegion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                  <span>{profile.locationRegion}</span>
                </span>
              )}
              {profile.experienceYears > 0 && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-stone-400" />
                  <span>{profile.experienceYears} Years Dedication</span>
                </span>
              )}
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                {profile.teachingMode === 'both' ? 'Online & In-Person' : `${profile.teachingMode} Instruction`}
              </span>
            </div>
          </div>

          {/* Languages & Subjects Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {profile.primarySubjects.map((sub) => (
              <span
                key={sub}
                className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200/80"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
        {/* Left Column: Philosophy & Bio (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {profile.teachingApproach && (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-stone-400">
                <Quote className="h-6 w-6 text-stone-400" />
                <span className="font-serif italic text-xs tracking-wider uppercase text-stone-500">
                  Pedagogical Philosophy
                </span>
              </div>
              <blockquote className="font-serif text-stone-800 text-base sm:text-lg leading-relaxed italic border-l-2 border-amber-300 pl-4">
                {profile.teachingApproach}
              </blockquote>
            </div>
          )}

          {profile.bio && (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 space-y-3 shadow-xs">
              <h3 className="font-serif text-base text-stone-900 font-semibold tracking-wide">
                Biography & Background
              </h3>
              <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </div>
            </div>
          )}

          {profile.availabilityHours.length > 0 && (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 space-y-3 shadow-xs">
              <h3 className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-stone-500" />
                <span>Office & Consultation Hours</span>
              </h3>
              <div className="space-y-2 text-xs divide-y divide-stone-100">
                {profile.availabilityHours.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between pt-2">
                    <span className="font-medium text-stone-700 capitalize">{slot.day}</span>
                    <span className="text-stone-500 font-mono text-[11px]">
                      {formatTimeRange(slot.start_time, slot.end_time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Offerings & Batches (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h2 className="font-serif text-xl text-stone-900 font-normal">
                Curated Batches & Cohorts
              </h2>
              <p className="text-xs text-stone-500 font-sans">
                Select a class to review curriculum and submit an enrollment inquiry.
              </p>
            </div>
            <span className="font-serif text-xs italic text-stone-500">
              {offerings.length} {offerings.length === 1 ? 'Cohort' : 'Cohorts'} Open
            </span>
          </div>

          {offerings.length > 0 ? (
            <div className="space-y-4">
              {offerings.map((batch) => {
                const reqStatus = requestMap.get(batch.id)

                return (
                  <div
                    key={batch.id}
                    className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400 transition-all shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-lg text-stone-900 font-semibold">
                            {batch.batchName}
                          </h3>
                          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                            {batch.classMode}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
                          {batch.subject && (
                            <span className="flex items-center gap-1 font-semibold text-stone-800">
                              <BookOpen className="h-3.5 w-3.5 text-stone-500" />
                              <span>{batch.subject}</span>
                            </span>
                          )}
                          {batch.className && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3.5 w-3.5 text-stone-400" />
                              <span>{batch.className}</span>
                            </span>
                          )}
                          {batch.schedule && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-stone-400" />
                              <span>{batch.schedule}</span>
                            </span>
                          )}
                          {batch.startTime && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-stone-500">
                              <Clock className="h-3.5 w-3.5 text-stone-400" />
                              <span>{formatTimeRange(batch.startTime, batch.endTime)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Request CTA */}
                      <div className="shrink-0 pt-2 sm:pt-0">
                        {reqStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Request Pending</span>
                          </span>
                        ) : reqStatus === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Enrolled</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => onRequestJoin(batch)}
                            className="bg-stone-900 hover:bg-stone-800 text-amber-100 text-xs font-medium px-4 py-2 rounded-xl shadow-xs"
                          >
                            <span>Request Admission</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {(batch.publicDescription || batch.description) && (
                      <div className="pt-3 border-t border-stone-100 text-xs text-stone-600 leading-relaxed font-sans">
                        {batch.publicDescription || batch.description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3">
              <Layers className="h-6 w-6 text-stone-400 mx-auto" />
              <h4 className="font-serif text-base text-stone-900">Cohorts Under Preparation</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                New academic batches are being organized. Inquiries can be directed through the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
