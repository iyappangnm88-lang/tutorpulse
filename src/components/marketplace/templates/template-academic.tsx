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
  ShieldCheck,
  Award,
  FileText,
  School,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { formatTimeRange } from '@/lib/scheduling'
import type { ProfileTemplateProps } from './types'

export function TemplateAcademic({
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
      {/* Academic Header Banner */}
      <div className="rounded-2xl border-2 border-slate-300 bg-white overflow-hidden shadow-xs">
        {/* Navy Top Bar */}
        <div className="bg-[#1E293B] text-white px-6 sm:px-10 py-6 sm:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-4 border-blue-600">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl object-cover border-2 border-slate-400 shadow-md"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl bg-slate-800 text-blue-300 font-serif font-bold text-3xl flex items-center justify-center border-2 border-slate-600 shadow-md">
                  {initials}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400">
                  Faculty Dossier
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-300">Nuzigo Academic Registry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white">
                {profile.fullName}
              </h1>
              {profile.headline && (
                <p className="text-sm sm:text-base text-slate-300 font-medium">
                  {profile.headline}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs font-mono text-slate-300">
            <div className="px-3 py-1 bg-slate-800/80 rounded border border-slate-700">
              <span>EXP: </span>
              <span className="text-blue-400 font-bold">{profile.experienceYears} Years</span>
            </div>
            <div className="px-3 py-1 bg-slate-800/80 rounded border border-slate-700">
              <span>MODE: </span>
              <span className="text-blue-400 font-bold uppercase">{profile.teachingMode}</span>
            </div>
          </div>
        </div>

        {/* Academic Overview Strip */}
        <div className="bg-slate-50 px-6 sm:px-10 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 font-medium">
          <div className="flex flex-wrap items-center gap-4">
            {profile.locationRegion && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Campus / Region: {profile.locationRegion}</span>
              </span>
            )}
            {profile.teachingLanguages.length > 0 && (
              <span>Languages: {profile.teachingLanguages.join(', ')}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-blue-800 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Instructor Credentials</span>
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic Credentials & Curriculum Areas (1 col) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Disciplines & Target Classes */}
          <div className="rounded-xl border border-slate-300 bg-white p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <School className="h-4 w-4 text-blue-700" />
              <span>Academic Disciplines</span>
            </h3>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Subjects</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.primarySubjects.map((sub) => (
                  <span
                    key={sub}
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-900 font-semibold text-xs border border-blue-200"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {profile.targetClasses.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Grade Levels</div>
                <div className="flex flex-wrap gap-1">
                  {profile.targetClasses.map((cls) => (
                    <span
                      key={cls}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Curriculum Philosophy */}
          {(profile.teachingApproach || profile.bio) && (
            <div className="rounded-xl border border-slate-300 bg-white p-5 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-700" />
                <span>Pedagogy & Methodology</span>
              </h3>

              {profile.teachingApproach && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 leading-relaxed font-serif">
                  {profile.teachingApproach}
                </div>
              )}

              {profile.bio && (
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-2">
                  {profile.bio}
                </div>
              )}
            </div>
          )}

          {/* Consultation Hours */}
          {profile.availabilityHours.length > 0 && (
            <div className="rounded-xl border border-slate-300 bg-white p-5 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-700" />
                <span>Scheduled Office Hours</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {profile.availabilityHours.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="font-semibold text-slate-700 capitalize">{slot.day}</span>
                    <span className="font-mono text-slate-600">
                      {formatTimeRange(slot.start_time, slot.end_time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Structured Course Offerings (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
            <div>
              <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-900">
                Curriculum Syllabus & Cohorts
              </h2>
              <p className="text-xs text-slate-500">
                Formal scheduled class sections currently accepting enrollment.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
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
                    className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs hover:border-blue-500 transition-colors"
                  >
                    <div className="bg-slate-100/70 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 uppercase">
                          Section
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{batch.batchName}</h3>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {batch.classMode}
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            Discipline
                          </span>
                          <span className="font-semibold text-slate-800">{batch.subject || 'General'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            Target Level
                          </span>
                          <span className="font-semibold text-slate-800">{batch.className || 'All Grades'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            Schedule
                          </span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {batch.schedule || 'Flexible'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            Timing
                          </span>
                          <span className="font-mono text-slate-800 text-[11px] block">
                            {batch.startTime ? formatTimeRange(batch.startTime, batch.endTime) : 'TBA'}
                          </span>
                        </div>
                      </div>

                      {(batch.publicDescription || batch.description) && (
                        <div className="text-xs text-slate-600 leading-relaxed border-l-2 border-slate-300 pl-3">
                          {batch.publicDescription || batch.description}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="text-[11px] font-mono text-slate-500">
                            Enrollment Code: {batch.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {batch.pricingRate != null ? (
                              <>₹{batch.pricingRate} /{batch.pricingUnit ? batch.pricingUnit.replace('per_', '') : 'month'}</>
                            ) : (
                              'Pricing not set'
                            )}
                          </span>
                        </div>

                        <div>
                          {reqStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Application Pending</span>
                            </span>
                          ) : reqStatus === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Matriculated</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => onRequestJoin(batch)}
                              className="bg-blue-800 hover:bg-blue-900 text-white font-mono text-xs px-4 py-1.5 rounded"
                            >
                              <span>Apply for Admission</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-300 bg-white p-8 text-center space-y-3">
              <Layers className="h-6 w-6 text-slate-400 mx-auto" />
              <h4 className="font-mono text-sm font-bold text-slate-900 uppercase">
                No Active Sections Available
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No public academic cohorts currently scheduled. Please check back for the upcoming term.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
