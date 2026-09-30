'use client'

import React from 'react'
import Link from 'next/link'
import {
  MapPin,
  Video,
  Building2,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { formatTimeRange } from '@/lib/scheduling'
import type { ProfileTemplateProps } from './types'

export function TemplateModern({
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
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Modern Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-gradient-to-br from-[#55C832]/10 to-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-md"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-[#55C832] to-[#318A25] text-white font-black text-3xl flex items-center justify-center shadow-md">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-sm" title="Verified Tutor">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {profile.fullName}
                </h1>
                <Badge
                  variant={
                    profile.teachingMode === 'online'
                      ? 'info'
                      : profile.teachingMode === 'offline'
                      ? 'default'
                      : 'success'
                  }
                  className="capitalize font-semibold text-xs"
                >
                  {profile.teachingMode === 'both' ? 'Online & In-Person' : profile.teachingMode}
                </Badge>
              </div>

              {profile.headline && (
                <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-0.5">
                {profile.locationRegion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.locationRegion}</span>
                  </span>
                )}
                {profile.experienceYears > 0 && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.experienceYears} Years Teaching</span>
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified Educator</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 text-left md:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batches</div>
              <div className="text-xl font-black text-slate-900">{offerings.length} Active</div>
            </div>
            {profile.teachingLanguages.length > 0 && (
              <div className="text-xs text-slate-500 text-left md:text-right">
                <span className="text-slate-400">Speaks: </span>
                <span className="font-semibold text-slate-700">{profile.teachingLanguages.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Teaching Philosophy & Subjects */}
        <div className="space-y-6 lg:col-span-1">
          {/* Subjects Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>Specialized Subjects</span>
              </h2>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {profile.primarySubjects.map((sub) => (
                  <span
                    key={sub}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-100"
                  >
                    {sub}
                  </span>
                ))}
              </div>

              {profile.targetClasses.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Target Classes / Grades
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.targetClasses.map((cls) => (
                      <span
                        key={cls}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* About & Approach */}
          {(profile.bio || profile.teachingApproach) && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Teaching Methodology</span>
                </h2>
              </CardHeader>
              <CardBody className="p-4 space-y-4">
                {profile.teachingApproach && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                    "{profile.teachingApproach}"
                  </div>
                )}
                {profile.bio && (
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Availability */}
          {profile.availabilityHours.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Available Hours</span>
                </h2>
              </CardHeader>
              <CardBody className="p-4">
                <div className="space-y-2">
                  {profile.availabilityHours.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                    >
                      <span className="font-semibold text-slate-700 capitalize">{slot.day}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatTimeRange(slot.start_time, slot.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: Active Batches */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Open Cohorts & Batches</h2>
              <p className="text-xs text-slate-500">
                Enroll directly or request admission to current live learning groups.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              {offerings.length} Available
            </span>
          </div>

          {offerings.length > 0 ? (
            <div className="space-y-4">
              {offerings.map((batch) => {
                const reqStatus = requestMap.get(batch.id)

                return (
                  <Card
                    key={batch.id}
                    className="border-slate-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md"
                  >
                    <CardBody className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {batch.batchName}
                            </h3>
                            <Badge
                              variant={batch.classMode === 'online' ? 'info' : 'default'}
                              className="text-[10px] uppercase font-bold"
                            >
                              {batch.classMode}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                            {batch.subject && (
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{batch.subject}</span>
                              </span>
                            )}
                            {batch.className && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                <span>{batch.className}</span>
                              </span>
                            )}
                            {batch.schedule && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>{batch.schedule}</span>
                              </span>
                            )}
                            {batch.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{formatTimeRange(batch.startTime, batch.endTime)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CTA button */}
                        <div className="shrink-0 pt-2 sm:pt-0">
                          {reqStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Request Pending</span>
                            </span>
                          ) : reqStatus === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => onRequestJoin(batch)}
                              className="bg-[#55C832] hover:bg-[#318A25] text-xs font-bold gap-1 shadow-sm"
                            >
                              <span>Request to Join</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {(batch.publicDescription || batch.description) && (
                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                          {batch.publicDescription || batch.description}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Public Batches Listed Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                This educator is accepting direct inquiries. Check back soon for newly opened cohorts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
