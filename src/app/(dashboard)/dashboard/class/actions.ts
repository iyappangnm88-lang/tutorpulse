'use server'

import { revalidatePath } from 'next/cache'
import { saveAttendanceAction, type AttendanceEntryInput } from '@/app/(dashboard)/dashboard/attendance/actions'
import { updateSessionStatus, updateSessionDetails } from '@/lib/class-sessions'
import type { ClassSessionStatus } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Updates the execution status of an offline physical class session.
 */
export async function updateOfflineClassStatusAction(
  sessionId: string,
  status: ClassSessionStatus
): Promise<ActionResult> {
  try {
    const res = await updateSessionStatus(sessionId, status)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath(`/dashboard/class/${sessionId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update class status.' }
  }
}

/**
 * Saves chalkboard/lesson notes for an offline physical class session.
 */
export async function saveOfflineSessionNotesAction(
  sessionId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const res = await updateSessionDetails(sessionId, { notes: notes.trim() || null })
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath(`/dashboard/class/${sessionId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/calendar')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save session notes.' }
  }
}

/**
 * Submits 1-click attendance roster for an offline physical class session.
 */
export async function saveOfflineAttendanceAction(
  batchId: string,
  sessionId: string,
  attendanceDate: string,
  entries: AttendanceEntryInput[]
): Promise<ActionResult<number>> {
  return saveAttendanceAction(batchId, attendanceDate, entries, sessionId)
}
