export type { WorkingDay, ClassMode } from '@/types'
import type { WorkingDay, ClassMode } from '@/types'

// Canonical ordering of days: Monday through Sunday
export const WORKING_DAYS_ORDER: readonly WorkingDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export const DAY_METADATA: Record<
  WorkingDay,
  { name: string; short: string; single: string; order: number }
> = {
  monday: { name: 'Monday', short: 'Mon', single: 'M', order: 1 },
  tuesday: { name: 'Tuesday', short: 'Tue', single: 'T', order: 2 },
  wednesday: { name: 'Wednesday', short: 'Wed', single: 'W', order: 3 },
  thursday: { name: 'Thursday', short: 'Thu', single: 'Th', order: 4 },
  friday: { name: 'Friday', short: 'Fri', single: 'F', order: 5 },
  saturday: { name: 'Saturday', short: 'Sat', single: 'S', order: 6 },
  sunday: { name: 'Sunday', short: 'Sun', single: 'Su', order: 7 },
}

export const CLASS_MODE_METADATA: Record<
  ClassMode,
  { label: string; description: string; badgeVariant: 'default' | 'info' | 'success' }
> = {
  offline: {
    label: 'Offline',
    description: 'In-person classroom at tuition center or physical location',
    badgeVariant: 'default',
  },
  online: {
    label: 'Online',
    description: 'Live interactive virtual classroom (video link in V2)',
    badgeVariant: 'info',
  },
  hybrid: {
    label: 'Hybrid',
    description: 'Combined in-person tuition and online streaming option',
    badgeVariant: 'success',
  },
}

const VALID_DAYS_SET = new Set<string>(WORKING_DAYS_ORDER)

/**
 * Normalizes an array of day strings:
 * - Lowercases and trims values
 * - Filters out invalid day strings
 * - Eliminates duplicates
 * - Sorts strictly in Monday → Sunday order
 */
export function normalizeWorkingDays(days?: string[] | null): WorkingDay[] {
  if (!days || !Array.isArray(days)) return []

  const uniqueValidDays = new Set<WorkingDay>()

  for (const day of days) {
    if (typeof day !== 'string') continue
    const cleaned = day.trim().toLowerCase()
    if (VALID_DAYS_SET.has(cleaned)) {
      uniqueValidDays.add(cleaned as WorkingDay)
    }
  }

  return WORKING_DAYS_ORDER.filter((canonicalDay) => uniqueValidDays.has(canonicalDay))
}

/**
 * Parses time string (e.g. '17:00:00' or '17:00') to total minutes since midnight
 */
export function timeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null
  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return null

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

/**
 * Formats a 24-hour time ('17:00' or '17:00:00') into 12-hour AM/PM format ('5:00 PM')
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr) return ''
  const totalMins = timeToMinutes(timeStr)
  if (totalMins === null) return timeStr

  const hours24 = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`

  return `${hours12}:${minsStr} ${period}`
}

/**
 * Formats a time range (e.g. '5:00 PM – 6:30 PM')
 */
export function formatTimeRange(start?: string | null, end?: string | null): string {
  const startFmt = formatTime12Hour(start)
  const endFmt = formatTime12Hour(end)

  if (startFmt && endFmt) {
    return `${startFmt} – ${endFmt}`
  }
  if (startFmt) {
    return `Starts at ${startFmt}`
  }
  return ''
}

/**
 * Calculates human duration between two time strings in minutes
 */
export function getDurationMinutes(start: string, end: string): number {
  const startMins = timeToMinutes(start)
  const endMins = timeToMinutes(end)
  if (startMins === null || endMins === null || endMins <= startMins) return 0
  return endMins - startMins
}

/**
 * Formats minutes into human-readable duration (e.g. '1 hr', '1 hr 30 mins', '45 mins')
 * Accepts either minutes directly: formatDuration(60)
 * Or start and end time strings: formatDuration('17:00', '18:00')
 */
export function formatDuration(durationMinutes: number): string
export function formatDuration(startTime?: string | null, endTime?: string | null): string
export function formatDuration(
  durationOrStart?: number | string | null,
  endTime?: string | null
): string {
  let mins = 0
  if (typeof durationOrStart === 'number') {
    mins = durationOrStart
  } else if (typeof durationOrStart === 'string' && endTime) {
    mins = getDurationMinutes(durationOrStart, endTime)
  }

  if (mins <= 0) return ''
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60

  if (hrs > 0 && remMins > 0) {
    return `${hrs} hr ${remMins} mins`
  }
  if (hrs > 0) {
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`
  }
  return `${remMins} mins`
}

/**
 * Returns formatted summary of selected working days:
 * - 'Mon · Wed · Fri' (short)
 * - 'Monday, Wednesday, Friday' (full)
 * - 'Weekdays (Mon–Fri)' if all 5 weekdays
 * - 'Weekends (Sat–Sun)' if Saturday and Sunday
 * - 'Everyday' if all 7 days
 */
export function formatDaysSummary(
  days?: string[] | null,
  format: 'short' | 'full' = 'short'
): string {
  const normalized = normalizeWorkingDays(days)
  if (normalized.length === 0) return 'No schedule'

  if (normalized.length === 7) {
    return 'Every day'
  }

  const isWeekdays =
    normalized.length === 5 &&
    normalized.every((d) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d))
  if (isWeekdays) {
    return format === 'short' ? 'Weekdays (Mon–Fri)' : 'Weekdays (Monday to Friday)'
  }

  const isWeekends =
    normalized.length === 2 &&
    normalized.includes('saturday') &&
    normalized.includes('sunday')
  if (isWeekends) {
    return 'Weekends (Sat & Sun)'
  }

  if (format === 'full') {
    return normalized.map((d) => DAY_METADATA[d].name).join(', ')
  }

  return normalized.map((d) => DAY_METADATA[d].short).join(' · ')
}

/**
 * Generates the unified backward-compatible schedule string
 * E.g. "Mon · Wed · Fri • 5:00 PM – 6:00 PM"
 */
export function formatScheduleString(
  days?: string[] | null,
  start?: string | null,
  end?: string | null
): string {
  const daysStr = formatDaysSummary(days, 'short')
  const timeStr = formatTimeRange(start, end)

  if (daysStr !== 'No schedule' && timeStr) {
    return `${daysStr} • ${timeStr}`
  }
  if (daysStr !== 'No schedule') {
    return daysStr
  }
  if (timeStr) {
    return timeStr
  }
  return ''
}

/**
 * Converts any local Date or 'YYYY-MM-DD' string to day of week:
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * Returns canonical WorkingDay.
 */
export function getDayOfWeekFromDate(targetDate: Date | string): WorkingDay {
  let dateObj: Date

  if (typeof targetDate === 'string') {
    // If 'YYYY-MM-DD', parse year, month, day to construct local date
    const parts = targetDate.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      dateObj = new Date(year, month, day)
    } else {
      dateObj = new Date(targetDate)
    }
  } else {
    dateObj = targetDate
  }

  // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
  const dayIndexMap: WorkingDay[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]

  return dayIndexMap[dateObj.getDay()]
}

/**
 * Determines whether a batch is scheduled to have classes on a target date.
 * Strictly local-date based; prevents timezone conversion day shifts.
 */
export function isBatchScheduledOnDate(
  batch: { working_days?: string[] | null },
  targetDate: Date | string
): boolean {
  const normalized = normalizeWorkingDays(batch.working_days)
  if (normalized.length === 0) return false

  const dayOfWeek = getDayOfWeekFromDate(targetDate)
  return normalized.includes(dayOfWeek)
}

/**
 * Filters a list of batches to only those with classes scheduled on the target date
 */
export function getBatchesScheduledForDate<T extends { working_days?: string[] | null }>(
  batches: T[],
  targetDate: Date | string
): T[] {
  return batches.filter((b) => isBatchScheduledOnDate(b, targetDate))
}

export interface ScheduleValidationResult {
  isValid: boolean
  errors: Record<string, string>
  normalizedData: {
    working_days: WorkingDay[]
    start_time: string | null
    end_time: string | null
    class_mode: ClassMode
    location: string | null
    schedule: string | null
  }
}

/**
 * Shared validation logic for client and server
 */
export function validateBatchSchedule(input: {
  working_days?: string[] | null
  start_time?: string | null
  end_time?: string | null
  class_mode?: string | null
  location?: string | null
}): ScheduleValidationResult {
  const errors: Record<string, string> = {}

  // 1. Working Days validation
  const normalizedDays = normalizeWorkingDays(input.working_days)
  if (normalizedDays.length === 0) {
    errors.working_days = 'Select at least one working day.'
  }

  // 2. Start Time validation
  const startTime = input.start_time?.trim() || ''
  const startMinutes = timeToMinutes(startTime)
  if (!startTime || startMinutes === null) {
    errors.start_time = 'Start time is required.'
  }

  // 3. End Time validation
  const endTime = input.end_time?.trim() || ''
  const endMinutes = timeToMinutes(endTime)
  if (!endTime || endMinutes === null) {
    errors.end_time = 'End time is required.'
  }

  // 4. Start vs End Time ordering
  if (startMinutes !== null && endMinutes !== null) {
    if (endMinutes <= startMinutes) {
      errors.end_time = 'End time must be later than start time.'
    }
  }

  // 5. Class Mode validation
  const rawMode = (input.class_mode || 'offline').toLowerCase().trim()
  let validMode: ClassMode = 'offline'
  if (rawMode === 'online' || rawMode === 'hybrid' || rawMode === 'offline') {
    validMode = rawMode
  } else {
    errors.class_mode = 'Invalid class mode. Must be Offline, Online, or Hybrid.'
  }

  // 6. Location validation
  const location = input.location?.trim() || null
  if (validMode === 'offline' && location && location.length > 200) {
    errors.location = 'Location cannot exceed 200 characters.'
  }

  const unifiedSchedule = formatScheduleString(
    normalizedDays,
    startTime || null,
    endTime || null
  )

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedData: {
      working_days: normalizedDays,
      start_time: startTime || null,
      end_time: endTime || null,
      class_mode: validMode,
      location: validMode === 'online' ? null : location,
      schedule: unifiedSchedule || null,
    },
  }
}
