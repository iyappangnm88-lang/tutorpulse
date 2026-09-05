'use server'

import { revalidatePath } from 'next/cache'
import {
  syncAndGetSessionsForDateRange,
  updateSessionStatus,
  rescheduleSession,
  updateSessionDetails,
  createAdhocSession,
} from '@/lib/class-sessions'
import { timeToMinutes } from '@/lib/scheduling'
import type { ClassSessionStatus, ClassMode, ClassSessionWithBatch } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function fetchCalendarSessionsAction(
  startDateStr: string,
  endDateStr: string,
  batchId?: string
): Promise<ActionResult<ClassSessionWithBatch[]>> {
  try {
    const { data, error } = await syncAndGetSessionsForDateRange(startDateStr, endDateStr, {
      batchId: batchId === 'all' ? undefined : batchId,
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch calendar sessions' }
  }
}

export async function updateSessionStatusAction(
  sessionId: string,
  status: ClassSessionStatus
): Promise<ActionResult> {
  try {
    const validStatuses: ClassSessionStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid session status' }
    }

    const res = await updateSessionStatus(sessionId, status)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update status' }
  }
}

export async function rescheduleSessionAction(
  sessionId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<ActionResult> {
  try {
    if (!newDate || !newStartTime || !newEndTime) {
      return { success: false, error: 'Date, start time, and end time are required' }
    }

    const startMins = timeToMinutes(newStartTime)
    const endMins = timeToMinutes(newEndTime)

    if (startMins === null || endMins === null) {
      return { success: false, error: 'Invalid time format' }
    }

    if (endMins <= startMins) {
      return { success: false, error: 'End time must be after start time' }
    }

    const res = await rescheduleSession(sessionId, newDate, newStartTime, newEndTime)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reschedule session' }
  }
}

export async function updateSessionDetailsAction(
  sessionId: string,
  details: {
    notes?: string | null
    location?: string | null
    meeting_link?: string | null
    class_mode?: ClassMode
  }
): Promise<ActionResult> {
  try {
    const res = await updateSessionDetails(sessionId, details)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update session details' }
  }
}

export async function createAdhocSessionAction(data: {
  batch_id: string
  session_date: string
  start_time: string
  end_time: string
  class_mode?: ClassMode
  location?: string | null
  notes?: string | null
}): Promise<ActionResult> {
  try {
    if (!data.batch_id || !data.session_date || !data.start_time || !data.end_time) {
      return { success: false, error: 'Batch, date, start time, and end time are required' }
    }

    const startMins = timeToMinutes(data.start_time)
    const endMins = timeToMinutes(data.end_time)

    if (startMins === null || endMins === null) {
      return { success: false, error: 'Invalid time format' }
    }

    if (endMins <= startMins) {
      return { success: false, error: 'End time must be after start time' }
    }

    const res = await createAdhocSession(data)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    return { success: true, data: res.data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create session' }
  }
}
