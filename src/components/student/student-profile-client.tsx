'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Pencil,
  Check,
  X,
  Camera,
  Clock,
  Award,
  BarChart3,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { uploadStudentAvatarAction, updateStudentDisplayNameAction } from '@/app/student/actions'
import { formatDuration } from '@/lib/types/study-groups'

interface DayStat {
  dayLabel: string
  dayShort: string
  dateStr: string
  seconds: number
  isToday: boolean
}

interface EarnedBadge {
  id: string
  name: string
  description: string
  iconUrl: string | null
  earnedAt: string
}

interface StudentProfileClientProps {
  userId: string
  initialFullName: string
  email: string
  initialAvatarUrl: string | null
  gradeLevel?: string | null
  schoolName?: string | null
  totalFocusedSeconds: number
  weeklyDays: DayStat[]
  totalWeekSeconds: number
  averageDailyFocusSeconds: number
  earnedBadges: EarnedBadge[]
}

export function StudentProfileClient({
  userId,
  initialFullName,
  email,
  initialAvatarUrl,
  gradeLevel,
  schoolName,
  totalFocusedSeconds,
  weeklyDays,
  totalWeekSeconds,
  averageDailyFocusSeconds,
  earnedBadges,
}: StudentProfileClientProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(initialFullName)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const initial = (fullName || 'S').trim().charAt(0).toUpperCase()

  // Find max seconds in weeklyDays for proportional bar heights (min 1hr scale)
  const maxDaySeconds = Math.max(3600, ...weeklyDays.map((d) => d.seconds))

  async function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Optimistic local preview
    const localPreview = URL.createObjectURL(file)
    setAvatarUrl(localPreview)

    const formData = new FormData()
    formData.append('avatar', file)

    const res = await uploadStudentAvatarAction(formData)
    setIsUploadingAvatar(false)

    if (res.success && res.data?.avatarUrl) {
      setAvatarUrl(res.data.avatarUrl)
      setSuccessMsg('Profile picture updated!')
      setTimeout(() => setSuccessMsg(null), 3000)
      router.refresh()
    } else {
      setAvatarUrl(initialAvatarUrl)
      setErrorMsg(res.error || 'Failed to upload image.')
    }
  }

  async function handleSaveName() {
    const clean = nameInput.trim()
    if (!clean) {
      setErrorMsg('Name cannot be empty.')
      return
    }

    setIsSavingName(true)
    setErrorMsg(null)

    const res = await updateStudentDisplayNameAction(clean)
    setIsSavingName(false)

    if (res.success && res.data?.fullName) {
      setFullName(res.data.fullName)
      setIsEditingName(false)
      setSuccessMsg('Name updated!')
      setTimeout(() => setSuccessMsg(null), 3000)
      router.refresh()
    } else {
      setErrorMsg(res.error || 'Failed to update name.')
    }
  }

  function handleCancelEdit() {
    setNameInput(fullName)
    setIsEditingName(false)
    setErrorMsg(null)
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12 lg:pb-0 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Focus</span>
        </Link>

        {/* Top-Right Settings Icon */}
        <Link
          href="/student/settings"
          aria-label="Settings and Account Controls"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] text-gray-600 dark:text-[#A8B3A5] hover:text-[#318A25] dark:hover:text-[#6BEA45] hover:border-[#55C832]/40 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C832]"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      {/* Alert Notifications */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="p-0.5 text-red-500">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs font-medium text-[#318A25] dark:text-[#6BEA45] flex items-center justify-between">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="p-0.5 text-emerald-500">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Identity Area */}
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        {/* Large Circular Avatar with Upload Trigger */}
        <div className="relative group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            aria-label="Upload profile image"
          />

          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            aria-label="Change profile picture"
            className="relative flex h-20 w-20 sm:h-22 sm:w-22 rounded-full ring-4 ring-[#55C832]/20 dark:ring-[#6BEA45]/20 hover:ring-[#55C832] dark:hover:ring-[#6BEA45] transition-all overflow-hidden shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#55C832]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-[#318A25] to-[#55C832] text-white text-2xl sm:text-3xl font-black">
                {initial}
              </div>
            )}

            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              {isUploadingAvatar ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </div>
          </button>

          {/* Small camera badge */}
          <button
            type="button"
            onClick={handleAvatarClick}
            aria-label="Upload photo"
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#55C832] text-white shadow-md hover:bg-[#318A25] transition-colors"
          >
            <Camera className="h-3 w-3" />
          </button>
        </div>

        {/* Display Name + Inline Edit Pencil */}
        <div className="mt-3 flex items-center justify-center gap-1.5 min-h-[32px]">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#161D16] border border-[#55C832] rounded-xl px-2 py-1 shadow-xs">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="text-sm font-bold text-[#172B4D] dark:text-[#F4F7F2] bg-transparent outline-none w-40 sm:w-48 px-1"
                placeholder="Your Name"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSavingName}
                aria-label="Save name"
                className="p-1 rounded-lg bg-[#55C832] text-white hover:bg-[#318A25] transition-colors"
              >
                {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Cancel editing"
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#202920] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight">
                {fullName}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameInput(fullName)
                  setIsEditingName(true)
                }}
                aria-label="Edit display name"
                className="p-1 rounded-lg text-gray-400 hover:text-[#318A25] dark:hover:text-[#6BEA45] hover:bg-gray-100 dark:hover:bg-[#1C261C] transition-colors cursor-pointer"
                title="Edit name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Academic Tag */}
        <p className="text-xs font-medium text-gray-500 dark:text-[#A8B3A5] mt-0.5">
          {gradeLevel ? `Class ${gradeLevel}` : 'Student'} {schoolName ? `• ${schoolName}` : ''}
        </p>
      </div>

      {/* 1. Total Time Focused Card */}
      <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] border border-emerald-200/60 dark:border-emerald-800/40">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#A8B3A5]">
                Total Time Focused
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                All-time completed study focus
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight">
              {formatDuration(totalFocusedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Your Achievements Card */}
      <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2]">
              Your Achievements
            </h2>
          </div>
          {earnedBadges.length > 0 && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
              {earnedBadges.length} {earnedBadges.length === 1 ? 'Badge' : 'Badges'}
            </span>
          )}
        </div>

        {earnedBadges.length === 0 ? (
          <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50/70 dark:bg-[#111711]/60 border border-dashed border-gray-200 dark:border-[#293329]">
            <Sparkles className="h-5 w-5 text-gray-400 dark:text-gray-600 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                No achievements yet
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Milestone badges will appear here as you focus and complete study goals.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                  🏆
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] truncate">
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Weekly Report Card */}
      <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2]">
              Weekly Report
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[#318A25] dark:text-[#6BEA45]">
              {formatDuration(averageDailyFocusSeconds)}/day
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">avg</span>
          </div>
        </div>

        {/* 7-Day Visual Mini Bar Chart */}
        <div className="pt-2">
          <div className="flex items-end justify-between gap-2 h-20 px-1">
            {weeklyDays.map((day) => {
              const heightPct = Math.max(8, Math.min(100, Math.round((day.seconds / maxDaySeconds) * 100)))

              return (
                <div
                  key={day.dateStr}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                >
                  {/* Hover duration tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-6 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                    {day.dayShort}: {formatDuration(day.seconds)}
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                      day.seconds > 0
                        ? day.isToday
                          ? 'bg-[#55C832] dark:bg-[#6BEA45] shadow-xs'
                          : 'bg-[#55C832]/60 dark:bg-[#6BEA45]/50 hover:bg-[#55C832]'
                        : 'bg-gray-100 dark:bg-[#202920]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Day Label */}
                  <span
                    className={`text-[10px] font-bold ${
                      day.isToday
                        ? 'text-[#318A25] dark:text-[#6BEA45]'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-[#202920]">
            <span>Mon – Sun</span>
            <span>
              Total: <strong className="text-gray-700 dark:text-gray-300">{formatDuration(totalWeekSeconds)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
