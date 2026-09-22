'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Search,
  BookOpen,
  MapPin,
  Video,
  Building2,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  GraduationCap,
  Users,
  Compass,
  CheckCircle2,
  ChevronRight,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody } from '@/components/ui/card'
import type { PublicTutorSummary } from '@/lib/marketplace-utils'

interface MarketplaceHomeClientProps {
  initialTutors: PublicTutorSummary[]
  totalCount: number
  currentPage: number
  totalPages: number
  currentFilters: {
    query: string
    subject: string
    grade: string
    mode: 'online' | 'offline' | 'both' | 'all'
    language: string
  }
  currentUser: {
    id: string
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
}

const COMMON_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Commerce',
  'Economics',
]

const COMMON_GRADES = [
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
]

export function MarketplaceHomeClient({
  initialTutors,
  totalCount,
  currentPage,
  totalPages,
  currentFilters,
  currentUser,
}: MarketplaceHomeClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(currentFilters.query)
  const [subject, setSubject] = useState(currentFilters.subject)
  const [grade, setGrade] = useState(currentFilters.grade)
  const [mode, setMode] = useState<string>(currentFilters.mode)

  function updateQueryParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams()
    if (query && !updates.hasOwnProperty('q')) params.set('q', query)
    if (subject && !updates.hasOwnProperty('subject')) params.set('subject', subject)
    if (grade && !updates.hasOwnProperty('grade')) params.set('grade', grade)
    if (mode && mode !== 'all' && !updates.hasOwnProperty('mode')) params.set('mode', mode)

    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateQueryParams({ q: query || null, page: null })
  }

  function handleClearFilters() {
    setQuery('')
    setSubject('')
    setGrade('')
    setMode('all')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = Boolean(
    currentFilters.query ||
      currentFilters.subject ||
      currentFilters.grade ||
      (currentFilters.mode && currentFilters.mode !== 'all')
  )

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
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                T
              </div>
              <span className="font-extrabold text-gray-900 tracking-tight text-lg">
                Tutor<span className="text-indigo-600">Pulse</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Directory
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link href={portalHref}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                    <span>Go to {currentUser.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Portal` : 'Dashboard'}</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
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

      {/* Hero Header */}
      <section className="border-b border-indigo-100 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 text-xs font-semibold text-indigo-900">
            <Compass className="h-3.5 w-3.5 text-indigo-600" />
            <span>Discover Verified Tutors & Batches</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
            Find the Right Teacher for Your Academic Goals
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Browse verified independent educators offering interactive online classes, local offline batches, and structured curricula.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="pt-2 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 rounded-2xl bg-white border border-gray-200 shadow-md">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by subject, tutor name, or city..."
                  className="w-full text-xs sm:text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400 py-1.5"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                loading={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs px-5 h-10 font-semibold"
              >
                Search Tutors
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Filter Pills and Dropdowns */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 pr-1">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <span>Filters:</span>
            </div>

            {/* Subject Select */}
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                updateQueryParams({ subject: e.target.value || null, page: null })
              }}
              className="text-xs rounded-lg border border-gray-200 bg-white py-1.5 px-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Subjects</option>
              {COMMON_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Grade Select */}
            <select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value)
                updateQueryParams({ grade: e.target.value || null, page: null })
              }}
              className="text-xs rounded-lg border border-gray-200 bg-white py-1.5 px-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Grades</option>
              {COMMON_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Mode Select */}
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value)
                updateQueryParams({ mode: e.target.value || null, page: null })
              }}
              className="text-xs rounded-lg border border-gray-200 bg-white py-1.5 px-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Modes</option>
              <option value="online">Online Classes</option>
              <option value="offline">Offline Tuition</option>
              <option value="both">Both Available</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs gap-1 h-8 text-gray-600 hover:text-gray-900 border-dashed"
              >
                <X className="h-3 w-3" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Found <span className="font-semibold text-gray-900">{totalCount}</span> verified {totalCount === 1 ? 'tutor' : 'tutors'}
          </div>
        </div>

        {/* Tutor Cards Grid */}
        {initialTutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {initialTutors.map((tutor) => {
              const initials = tutor.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()

              return (
                <Card
                  key={tutor.id}
                  className="flex flex-col justify-between hover:shadow-md transition-shadow border-gray-200/90"
                >
                  <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Top Header with Avatar and Mode */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center shrink-0 border border-indigo-200">
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">
                              {tutor.fullName}
                            </h3>
                            {tutor.locationRegion && (
                              <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
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
                          className="text-[10px] shrink-0 capitalize"
                        >
                          {tutor.teachingMode === 'both' ? 'Online + Offline' : tutor.teachingMode}
                        </Badge>
                      </div>

                      {/* Headline */}
                      {tutor.headline ? (
                        <p className="text-xs text-gray-700 font-medium line-clamp-2">
                          {tutor.headline}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          Independent Tutor on TutorPulse
                        </p>
                      )}

                      {/* Bio snippet */}
                      {tutor.bio && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {tutor.bio}
                        </p>
                      )}

                      {/* Subjects & Grades */}
                      <div className="space-y-1.5 pt-1">
                        {tutor.primarySubjects && tutor.primarySubjects.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tutor.primarySubjects.slice(0, 3).map((sub) => (
                              <span
                                key={sub}
                                className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100"
                              >
                                {sub}
                              </span>
                            ))}
                            {tutor.primarySubjects.length > 3 && (
                              <span className="text-[10px] text-gray-400 self-center">
                                +{tutor.primarySubjects.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {tutor.targetClasses && tutor.targetClasses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tutor.targetClasses.slice(0, 3).map((cls) => (
                              <span
                                key={cls}
                                className="px-1.5 py-0.2 rounded text-gray-600 bg-gray-100 text-[10px]"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-gray-500">
                        {tutor.publicOfferingCount > 0 ? (
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {tutor.publicOfferingCount}{' '}
                            {tutor.publicOfferingCount === 1 ? 'batch open' : 'batches open'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Profile inquiries open</span>
                        )}
                      </div>

                      <Link href={`/tutors/${tutor.profileSlug}`}>
                        <Button size="sm" className="text-xs gap-1 bg-indigo-600 hover:bg-indigo-700">
                          <span>View Classes</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Graceful Zero-Tutor Empty State */
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Compass className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {hasActiveFilters
                  ? 'No tutors match your filter criteria'
                  : 'Welcome to the TutorPulse Directory'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {hasActiveFilters
                  ? 'Try broadening your search keyword, selecting "All Subjects", or clearing selected filters.'
                  : 'Independent tutors are configuring their public batch offerings. If you already have an invite code from your teacher, you can join directly.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {hasActiveFilters ? (
                <Button onClick={handleClearFilters} size="sm" variant="outline" className="text-xs">
                  Clear All Filters
                </Button>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      Sign Up as Student
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings">
                    <Button size="sm" variant="outline" className="text-xs">
                      Tutor? Enable Public Profile
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
              className="text-xs"
            >
              Previous
            </Button>
            <span className="text-xs text-gray-600 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} TutorPulse. Empowering independent education.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/tutors" className="hover:text-indigo-600">
              Browse Directory
            </Link>
            <Link href="/login" className="hover:text-indigo-600">
              Tutor Login
            </Link>
            <Link href="/register" className="hover:text-indigo-600">
              Student Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
