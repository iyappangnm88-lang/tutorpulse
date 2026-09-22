'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
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
  ExternalLink,
  Edit,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { RequestJoinDialog } from './request-join-dialog'
import { formatTimeRange } from '@/lib/scheduling'
import type { PublicTutorDetail, PublicTeachingOffering } from '@/lib/marketplace-utils'

interface PublicTutorProfileClientProps {
  tutorDetail: PublicTutorDetail
  currentUser: {
    id: string
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
  isOwner: boolean
  existingRequests: Array<{ batchId: string; status: string }>
  selectedOfferingId: string | null
}

export function PublicTutorProfileClient({
  tutorDetail,
  currentUser,
  isOwner,
  existingRequests,
  selectedOfferingId,
}: PublicTutorProfileClientProps) {
  const router = useRouter()
  const { profile, offerings } = tutorDetail

  const initialOffering =
    offerings.find((o) => o.id === selectedOfferingId) || null
  const [activeOffering, setActiveOffering] = useState<PublicTeachingOffering | null>(
    initialOffering
  )
  const [dialogOpen, setDialogOpen] = useState(Boolean(initialOffering))

  const requestMap = new Map(existingRequests.map((r) => [r.batchId, r.status]))

  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const portalHref =
    currentUser?.role === 'tutor'
      ? '/dashboard'
      : currentUser?.role === 'student'
      ? '/student'
      : currentUser?.role === 'parent'
      ? '/parent'
      : '/dashboard'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/tutors"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link href={portalHref}>
                <Button size="sm" variant="outline" className="text-xs">
                  My Portal
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Owner Notice Banner */}
      {isOwner && (
        <div className="bg-indigo-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <span>This is how prospective students view your public profile.</span>
          <Link
            href="/dashboard/settings"
            className="underline underline-offset-2 font-bold inline-flex items-center gap-1 hover:text-indigo-100"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile Settings</span>
          </Link>
        </div>
      )}

      {/* Main Profile Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Profile Hero Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
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
                    className="capitalize text-xs font-semibold"
                  >
                    {profile.teachingMode === 'both'
                      ? 'Online + Offline'
                      : profile.teachingMode}
                  </Badge>
                </div>

                {profile.headline && (
                  <p className="text-sm sm:text-base font-medium text-gray-700 leading-snug">
                    {profile.headline}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                  {profile.locationRegion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {profile.locationRegion}
                    </span>
                  )}
                  {profile.experienceYears > 0 && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                      {profile.experienceYears}+ years experience
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Educator
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats or Share */}
            <div className="w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <div className="text-left sm:text-right">
                <span className="text-xl font-bold text-gray-900 block">
                  {offerings.length}
                </span>
                <span className="text-[11px] text-gray-500">
                  {offerings.length === 1 ? 'Open Offering' : 'Open Offerings'}
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Grade Badges */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 mr-1">Specializations:</span>
            {profile.primarySubjects.map((sub) => (
              <span
                key={sub}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100"
              >
                {sub}
              </span>
            ))}
            {profile.targetClasses.map((cls) => (
              <span
                key={cls}
                className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs"
              >
                {cls}
              </span>
            ))}
            {profile.teachingLanguages.map((lang) => (
              <span
                key={lang}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* 2-Column Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bio & Methodology */}
          <div className="lg:col-span-1 space-y-6">
            {profile.bio && (
              <Card>
                <CardHeader>
                  <h2 className="text-base font-bold text-gray-900">About the Tutor</h2>
                </CardHeader>
                <CardBody>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </CardBody>
              </Card>
            )}

            {profile.teachingApproach && (
              <Card>
                <CardHeader>
                  <h2 className="text-base font-bold text-gray-900">
                    Teaching Approach & Methodology
                  </h2>
                </CardHeader>
                <CardBody>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {profile.teachingApproach}
                  </p>
                </CardBody>
              </Card>
            )}

            <Card className="bg-indigo-50/40 border-indigo-100">
              <CardBody className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>How Enrollment Works</span>
                </div>
                <ol className="text-[11px] text-indigo-900/80 space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>Browse open cohorts and review the schedule.</li>
                  <li>Click <strong>Request to Join</strong> with an introductory note.</li>
                  <li>The tutor reviews and accepts your request.</li>
                  <li>Access live sessions, homework, and test materials automatically!</li>
                </ol>
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Public Batch Offerings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Open Teaching Batches</h2>
                <p className="text-xs text-gray-500">
                  Select a cohort below to view schedule details and submit an enrollment request.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {offerings.length} {offerings.length === 1 ? 'batch' : 'batches'}
              </span>
            </div>

            {offerings.length > 0 ? (
              <div className="space-y-4">
                {offerings.map((batch) => {
                  const reqStatus = requestMap.get(batch.id)

                  return (
                    <Card
                      key={batch.id}
                      className="hover:border-indigo-200 transition-colors border-gray-200"
                    >
                      <CardBody className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-base text-gray-900">
                                {batch.batchName}
                              </h3>
                              <Badge
                                variant={batch.classMode === 'online' ? 'info' : 'default'}
                                className="text-[10px] capitalize"
                              >
                                {batch.classMode}
                              </Badge>
                              {batch.subject && (
                                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                                  {batch.subject}
                                </span>
                              )}
                              {batch.className && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  {batch.className}
                                </span>
                              )}
                            </div>

                            {/* Schedule & Timing Info */}
                            <div className="flex flex-wrap items-center gap-3.5 text-xs text-gray-600 pt-1.5">
                              {batch.schedule && (
                                <span className="flex items-center gap-1 font-medium">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  {batch.schedule}
                                </span>
                              )}
                              {(batch.startTime || batch.endTime) && (
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  {formatTimeRange(batch.startTime, batch.endTime)}
                                </span>
                              )}
                              {batch.location && batch.classMode !== 'online' && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                  {batch.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Request Button or Status */}
                          <div className="shrink-0 pt-2 sm:pt-0">
                            {reqStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Request Pending</span>
                              </span>
                            ) : reqStatus === 'accepted' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Already Enrolled</span>
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveOffering(batch)
                                  setDialogOpen(true)
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold gap-1"
                              >
                                <span>Request to Join</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Public Description or Syllabus */}
                        {(batch.publicDescription || batch.description) && (
                          <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
                            {batch.publicDescription || batch.description}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
                  <Layers className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  No Public Batches Listed Yet
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  This tutor is currently accepting inquiries or preparing their cohort syllabus. Check back soon or reach out via platform channels.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Join Request Dialog */}
      <RequestJoinDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setActiveOffering(null)
        }}
        tutor={profile}
        offering={activeOffering}
        currentUser={currentUser}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
