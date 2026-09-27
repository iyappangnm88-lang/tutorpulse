import { createClient } from '@/lib/supabase/server'
import { getStudentRecordIdsForStudent } from './student-portal'

export interface DayAttendanceStatus {
  dayName: string
  dayShort: string
  isScheduled: boolean
  isAttended: boolean
  isPending: boolean
  dateStr: string
}

export interface BatchStreakInfo {
  batchId: string
  batchName: string
  tutorName: string
  classesPerWeek: number
  workingDays: string[]
  completedThisWeek: number
  targetThisWeek: number
  remainingThisWeek: number
  isCompletedThisWeek: boolean
  streakWeeks: number
  daysStatus: DayAttendanceStatus[]
}

export interface StudentWeeklyStreaks {
  overallStreakWeeks: number
  totalTargetThisWeek: number
  totalCompletedThisWeek: number
  batches: BatchStreakInfo[]
}

function getMondayOfCurrentWeek(d = new Date()): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const monday = new Date(date.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Calculates schedule-based weekly streaks for a student.
 * Uses tutor-configured classes_per_week (1-7) per batch.
 */
export async function getStudentWeeklyStreaks(studentUserId: string): Promise<StudentWeeklyStreaks> {
  const supabase = await createClient()

  // 1. Fetch student user email for student record matching
  const { data: userRow } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentUserId)
    .maybeSingle()

  const studentRecordIds = await getStudentRecordIdsForStudent(studentUserId, userRow?.email)

  // 2. Fetch enrolled batches with tutor name and classes_per_week
  let batchList: any[] = []

  // Check batch_students
  if (studentRecordIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('batch_students')
      .select(`
        batch_id,
        batch:batches (
          id,
          name,
          classes_per_week,
          working_days,
          tutor_id,
          status,
          profiles:tutor_id (full_name)
        )
      `)
      .in('student_id', studentRecordIds)
      .eq('status', 'active')

    if (enrollments) {
      batchList = enrollments
        .map((e: any) => e.batch)
        .filter((b: any) => b && b.status === 'active')
    }
  }

  // Deduplicate batches
  const uniqueBatchesMap = new Map<string, any>()
  batchList.forEach((b) => {
    if (b && !uniqueBatchesMap.has(b.id)) {
      uniqueBatchesMap.set(b.id, b)
    }
  })
  const enrolledBatches = Array.from(uniqueBatchesMap.values())

  if (enrolledBatches.length === 0 || studentRecordIds.length === 0) {
    return {
      overallStreakWeeks: 0,
      totalTargetThisWeek: 0,
      totalCompletedThisWeek: 0,
      batches: [],
    }
  }

  const batchIds = enrolledBatches.map((b) => b.id)

  // 3. Fetch past 60 days of attendance for these batches
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const sixtyDaysAgoStr = toDateString(sixtyDaysAgo)

  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('batch_id, attendance_date, status')
    .in('batch_id', batchIds)
    .in('student_id', studentRecordIds)
    .gte('attendance_date', sixtyDaysAgoStr)
    .in('status', ['present', 'late'])

  // Also query classroom_participants for live online classes joined
  const { data: onlineSessions } = await supabase
    .from('classroom_participants')
    .select(`
      joined_at,
      session:class_sessions!inner(batch_id, start_time)
    `)
    .eq('user_id', studentUserId)
    .gte('joined_at', sixtyDaysAgo.toISOString())

  // Build a set of attended dates per batch: Map<batchId, Set<dateStr>>
  const attendedDatesByBatch = new Map<string, Set<string>>()
  batchIds.forEach((bId) => attendedDatesByBatch.set(bId, new Set<string>()))

  ;(attendanceData || []).forEach((att) => {
    const set = attendedDatesByBatch.get(att.batch_id)
    if (set && att.attendance_date) {
      set.add(att.attendance_date)
    }
  })

  ;(onlineSessions || []).forEach((p: any) => {
    const bId = p.session?.batch_id
    if (bId && attendedDatesByBatch.has(bId) && p.joined_at) {
      const dateStr = p.joined_at.split('T')[0]
      attendedDatesByBatch.get(bId)!.add(dateStr)
    }
  })

  // 4. Calculate weekly streaks for each batch
  const now = new Date()
  const currentMonday = getMondayOfCurrentWeek(now)
  const todayStr = toDateString(now)

  // Days of current week (Monday to Sunday)
  const currentWeekDates: { date: Date; dateStr: string; dayShort: string; dayName: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentMonday)
    d.setDate(currentMonday.getDate() + i)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    currentWeekDates.push({
      date: d,
      dateStr: toDateString(d),
      dayName: dayNames[d.getDay()],
      dayShort: dayShorts[d.getDay()],
    })
  }

  const batchStreakResults: BatchStreakInfo[] = enrolledBatches.map((batch) => {
    const batchAttendedSet = attendedDatesByBatch.get(batch.id) || new Set<string>()
    const workingDays: string[] = (batch.working_days || []).map((w: string) => w.toLowerCase())

    // Classes per week target: from column or working days length or default 3
    const targetThisWeek = Math.max(1, Math.min(7, batch.classes_per_week || (workingDays.length > 0 ? workingDays.length : 3)))

    // Calculate this week's attendance
    let completedThisWeek = 0
    const daysStatus: DayAttendanceStatus[] = currentWeekDates.map((dayObj) => {
      const isScheduled = workingDays.length > 0
        ? workingDays.includes(dayObj.dayName.toLowerCase())
        : true
      const isAttended = batchAttendedSet.has(dayObj.dateStr)
      if (isAttended) completedThisWeek++

      const isPending = !isAttended && dayObj.dateStr >= todayStr && isScheduled

      return {
        dayName: dayObj.dayName,
        dayShort: dayObj.dayShort,
        isScheduled,
        isAttended,
        isPending,
        dateStr: dayObj.dateStr,
      }
    })

    const isCompletedThisWeek = completedThisWeek >= targetThisWeek
    const remainingThisWeek = Math.max(0, targetThisWeek - completedThisWeek)

    // Calculate historical consecutive weeks
    let streakWeeks = 0
    // Check past weeks starting from last week (week -1, week -2, ...)
    for (let w = 1; w <= 8; w++) {
      const pastMonday = new Date(currentMonday)
      pastMonday.setDate(currentMonday.getDate() - w * 7)

      let pastWeekAttended = 0
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(pastMonday)
        checkDate.setDate(pastMonday.getDate() + dayOffset)
        const dateStr = toDateString(checkDate)
        if (batchAttendedSet.has(dateStr)) {
          pastWeekAttended++
        }
      }

      if (pastWeekAttended >= targetThisWeek) {
        streakWeeks++
      } else {
        break // Streak broken
      }
    }

    // If current week has already met target, add 1 to active streak!
    if (isCompletedThisWeek) {
      streakWeeks++
    }

    const tutorName = batch.profiles?.full_name || 'Tutor'

    return {
      batchId: batch.id,
      batchName: batch.name,
      tutorName,
      classesPerWeek: targetThisWeek,
      workingDays,
      completedThisWeek,
      targetThisWeek,
      remainingThisWeek,
      isCompletedThisWeek,
      streakWeeks,
      daysStatus,
    }
  })

  const overallStreakWeeks = batchStreakResults.reduce((max, b) => Math.max(max, b.streakWeeks), 0)
  const totalTargetThisWeek = batchStreakResults.reduce((sum, b) => sum + b.targetThisWeek, 0)
  const totalCompletedThisWeek = batchStreakResults.reduce((sum, b) => sum + b.completedThisWeek, 0)

  return {
    overallStreakWeeks,
    totalTargetThisWeek,
    totalCompletedThisWeek,
    batches: batchStreakResults,
  }
}
