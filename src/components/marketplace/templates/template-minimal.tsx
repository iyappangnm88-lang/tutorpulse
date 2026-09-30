'use client'

import React from 'react'
import Link from 'next/link'
import {
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTimeRange } from '@/lib/scheduling'
import type { ProfileTemplateProps } from './types'

export function TemplateMinimal({
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
    <div className="max-w-4xl mx-auto space-y-16 animate-fade-in font-sans py-4">
      {/* Minimalist Profile Header */}
      <div className="space-y-8 border-b border-black/10 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-20 w-20 rounded-full object-cover grayscale contrast-125 border border-black/10"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-black text-white font-medium text-xl flex items-center justify-center">
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black">
                {profile.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                {profile.locationRegion && <span>{profile.locationRegion}</span>}
                {profile.experienceYears > 0 && (
                  <>
                    <span>•</span>
                    <span>{profile.experienceYears} yrs teaching</span>
                  </>
                )}
                <span>•</span>
                <span className="capitalize">{profile.teachingMode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
              Verified
            </span>
            <ShieldCheck className="h-4 w-4 text-black" />
          </div>
        </div>

        {profile.headline && (
          <p className="text-lg sm:text-xl font-light text-neutral-800 leading-relaxed max-w-2xl">
            {profile.headline}
          </p>
        )}

        {/* Subjects in minimal pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {profile.primarySubjects.map((sub) => (
            <span
              key={sub}
              className="px-3 py-1 rounded-full text-xs font-medium text-black bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              {sub}
            </span>
          ))}
          {profile.targetClasses.map((cls) => (
            <span
              key={cls}
              className="px-3 py-1 rounded-full text-xs font-normal text-neutral-600 border border-neutral-200"
            >
              {cls}
            </span>
          ))}
        </div>
      </div>

      {/* Philosophy & Background */}
      {(profile.teachingApproach || profile.bio) && (
        <div className="space-y-6 border-b border-black/10 pb-12">
          <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-400">
            About & Approach
          </h2>
          {profile.teachingApproach && (
            <p className="text-base font-normal text-neutral-800 leading-relaxed max-w-2xl">
              {profile.teachingApproach}
            </p>
          )}
          {profile.bio && (
            <p className="text-sm font-light text-neutral-600 leading-relaxed max-w-2xl whitespace-pre-line">
              {profile.bio}
            </p>
          )}
        </div>
      )}

      {/* Available Batches */}
      <div className="space-y-8">
        <div className="flex items-baseline justify-between border-b border-black/10 pb-4">
          <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-400">
            Current Batches ({offerings.length})
          </h2>
          <span className="text-xs text-neutral-400">Direct Admission</span>
        </div>

        {offerings.length > 0 ? (
          <div className="divide-y divide-black/10">
            {offerings.map((batch) => {
              const reqStatus = requestMap.get(batch.id)

              return (
                <div key={batch.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-black">{batch.batchName}</h3>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                          [{batch.classMode}]
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        {batch.subject && <span className="text-black font-medium">{batch.subject}</span>}
                        {batch.className && <span>{batch.className}</span>}
                        {batch.schedule && <span>{batch.schedule}</span>}
                        {batch.startTime && (
                          <span className="font-mono">
                            {formatTimeRange(batch.startTime, batch.endTime)}
                          </span>
                        )}
                      </div>

                      {(batch.publicDescription || batch.description) && (
                        <p className="text-xs font-light text-neutral-600 pt-1 leading-relaxed max-w-xl">
                          {batch.publicDescription || batch.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      {reqStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
                          <span>Pending</span>
                        </span>
                      ) : reqStatus === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-black bg-neutral-100 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Enrolled</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onRequestJoin(batch)}
                          className="bg-black hover:bg-neutral-800 text-white text-xs font-normal px-4 py-2 rounded-full gap-1"
                        >
                          <span>Request</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 font-mono uppercase tracking-wider">
            No active batches listed
          </div>
        )}
      </div>

      {/* Available Hours minimal */}
      {profile.availabilityHours.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-black/10">
          <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-400">
            Hours & Office Time
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {profile.availabilityHours.map((slot, i) => (
              <div key={i} className="space-y-0.5">
                <span className="capitalize font-medium text-black">{slot.day}</span>
                <span className="block font-mono text-neutral-500 text-[11px]">
                  {formatTimeRange(slot.start_time, slot.end_time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
