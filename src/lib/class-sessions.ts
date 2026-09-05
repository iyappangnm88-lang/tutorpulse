import { createClient } from '@/lib/supabase/server'
import { isBatchScheduledOnDate, normalizeWorkingDays } from '@/lib/scheduling'
import type { Batch, ClassSession, ClassSessionInsert, ClassSessionStatus, ClassSessionWithBatch, ClassMode } from '@/types'

export {
  formatDateKey,
  parseDateKey,
  addDays,
  getDateRangeArray,
} from './calendar-utils'
import {
  formatDateKey,
  parseDateKey,
  addDays,
  getDateRangeArray,
} from './calendar-utils'

/**
 * Core Session Engine: Windowed, idempotent session synchronizer.
 * Scans active batches with recurring schedules, identifies scheduled dates in [startDate, endDate],
 * and inserts missing class_sessions. Never duplicates or overwrites overridden sessions.
 */
export async function syncAndGetSessionsForDateRange(
  startDateStr: string,
  endDateStr: string,
  options?: { batchId?: string }
): Promise<{ data: ClassSessionWithBatch[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Unauthorized' }
    }

    // 1. Fetch active batches for this tutor
    let batchQuery = supabase
      .from('batches')
      .select('*')
      .eq('tutor_id', user.id)
      .eq('status', 'active')

    if (options?.batchId) {
      batchQuery = batchQuery.eq('id', options.batchId)
    }

    const { data: batches, error: batchError } = await batchQuery

    if (batchError) {
      if (batchError.code === 'PGRST205' || batchError.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: batchError.message }
    }

    const activeBatches: Batch[] = batches || []

    // 2. Fetch existing sessions in the date range
    let existingQuery = supabase
      .from('class_sessions')
      .select('*')
      .eq('tutor_id', user.id)
      .gte('session_date', startDateStr)
      .lte('session_date', endDateStr)

    if (options?.batchId) {
      existingQuery = existingQuery.eq('batch_id', options.batchId)
    }

    const { data: existingSessions, error: sessionsError } = await existingQuery

    if (sessionsError && sessionsError.code !== 'PGRST205' && sessionsError.code !== '42P01') {
      return { data: [], error: sessionsError.message }
    }

    const existingMap = new Set<string>()
    if (existingSessions) {
      for (const s of existingSessions) {
        existingMap.add(`${s.batch_id}_${s.session_date}`)
      }
    }

    // 3. Identify missing sessions for all scheduled batch days in range
    const allDates = getDateRangeArray(startDateStr, endDateStr)
    const newSessionsToInsert: ClassSessionInsert[] = []

    for (const batch of activeBatches) {
      // Must have working_days and times defined
      const workingDays = normalizeWorkingDays(batch.working_days)
      if (workingDays.length === 0 || !batch.start_time || !batch.end_time) {
        continue
      }

      for (const dateStr of allDates) {
        const key = `${batch.id}_${dateStr}`
        if (existingMap.has(key)) {
          continue
        }

        if (isBatchScheduledOnDate(batch, dateStr)) {
          newSessionsToInsert.push({
            tutor_id: user.id,
            batch_id: batch.id,
            session_date: dateStr,
            start_time: batch.start_time,
            end_time: batch.end_time,
            status: 'scheduled',
            class_mode: batch.class_mode || 'offline',
            location: batch.location || null,
            notes: null,
            is_overridden: false,
          })
          // Mark in map so we don't duplicate within same loop
          existingMap.add(key)
        }
      }
    }

    // 4. Upsert missing sessions atomically (ignoreDuplicates ensures complete idempotency)
    if (newSessionsToInsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('class_sessions')
        .upsert(newSessionsToInsert, {
          onConflict: 'batch_id,session_date',
          ignoreDuplicates: true,
        })

      if (upsertError && upsertError.code !== 'PGRST205' && upsertError.code !== '42P01') {
        console.error('Error upserting class sessions:', upsertError)
      }
    }

    // 5. Query final list of sessions in the date range with joined batch details
    let finalQuery = supabase
      .from('class_sessions')
      .select('*, batch:batches(*)')
      .eq('tutor_id', user.id)
      .gte('session_date', startDateStr)
      .lte('session_date', endDateStr)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (options?.batchId) {
      finalQuery = finalQuery.eq('batch_id', options.batchId)
    }

    const { data: finalSessions, error: finalError } = await finalQuery

    if (finalError) {
      if (finalError.code === 'PGRST205' || finalError.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: finalError.message }
    }

    // 6. Fetch active student counts for each batch
    const batchIdList = Array.from(new Set((finalSessions || []).map((s) => s.batch_id)))
    const studentCountMap: Record<string, number> = {}

    if (batchIdList.length > 0) {
      const { data: counts } = await supabase
        .from('batch_students')
        .select('batch_id')
        .in('batch_id', batchIdList)
        .eq('status', 'active')

      if (counts) {
        for (const row of counts) {
          studentCountMap[row.batch_id] = (studentCountMap[row.batch_id] || 0) + 1
        }
      }
    }

    const formattedSessions: ClassSessionWithBatch[] = (finalSessions || []).map((session) => ({
      ...session,
      batch: session.batch as Batch,
      student_count: studentCountMap[session.batch_id] || 0,
    }))

    return { data: formattedSessions, error: null }
  } catch (err: any) {
    console.error('Unexpected error in syncAndGetSessionsForDateRange:', err)
    return { data: [], error: err.message || 'Failed to sync sessions' }
  }
}

/**
 * Returns today's class sessions for the logged-in tutor
 */
export async function getTodaySessions(): Promise<{ data: ClassSessionWithBatch[]; error: string | null }> {
  const todayStr = formatDateKey(new Date())
  return syncAndGetSessionsForDateRange(todayStr, todayStr)
}

/**
 * Returns upcoming class sessions starting from today
 */
export async function getUpcomingSessions(
  limit: number = 5
): Promise<{ data: ClassSessionWithBatch[]; error: string | null }> {
  const today = new Date()
  const todayStr = formatDateKey(today)
  const futureStr = formatDateKey(addDays(today, 14))

  const { data, error } = await syncAndGetSessionsForDateRange(todayStr, futureStr)
  if (error) return { data: [], error }

  // Filter out cancelled if needed, or sort and slice
  const upcoming = data
    .filter((s) => s.status !== 'cancelled' && s.status !== 'completed')
    .slice(0, limit)

  return { data: upcoming, error: null }
}

/**
 * Returns upcoming sessions for a specific batch
 */
export async function getBatchUpcomingSessions(
  batchId: string,
  limit: number = 6
): Promise<{ data: ClassSessionWithBatch[]; error: string | null }> {
  const today = new Date()
  const todayStr = formatDateKey(today)
  const futureStr = formatDateKey(addDays(today, 30))

  const { data, error } = await syncAndGetSessionsForDateRange(todayStr, futureStr, { batchId })
  if (error) return { data: [], error }

  return { data: data.slice(0, limit), error: null }
}

/**
 * Gets a single session with batch and student count details
 */
export async function getSessionById(
  sessionId: string
): Promise<{ data: ClassSessionWithBatch | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: session, error } = await supabase
      .from('class_sessions')
      .select('*, batch:batches(*)')
      .eq('id', sessionId)
      .maybeSingle()

    if (error || !session) {
      return { data: null, error: error?.message || 'Session not found' }
    }

    const { count } = await supabase
      .from('batch_students')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', session.batch_id)
      .eq('status', 'active')

    return {
      data: {
        ...session,
        batch: session.batch as Batch,
        student_count: count || 0,
      },
      error: null,
    }
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch session' }
  }
}

/**
 * Updates session status (scheduled -> in_progress -> completed / cancelled)
 */
export async function updateSessionStatus(
  sessionId: string,
  status: ClassSessionStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('class_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('tutor_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update session status' }
  }
}

/**
 * Reschedules a single session to a new date/time and marks it overridden
 */
export async function rescheduleSession(
  sessionId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    // Fetch existing session
    const { data: session, error: fetchErr } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('tutor_id', user.id)
      .single()

    if (fetchErr || !session) {
      return { success: false, error: 'Session not found or permission denied' }
    }

    // Check if another session already exists on newDate for this batch (if date changed)
    if (session.session_date !== newDate) {
      const { data: conflicting } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('batch_id', session.batch_id)
        .eq('session_date', newDate)
        .neq('id', sessionId)
        .maybeSingle()

      if (conflicting) {
        return {
          success: false,
          error: `A session for this batch already exists on ${newDate}. Please choose a different date.`,
        }
      }
    }

    const { error: updateErr } = await supabase
      .from('class_sessions')
      .update({
        session_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        is_overridden: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('tutor_id', user.id)

    if (updateErr) return { success: false, error: updateErr.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reschedule session' }
  }
}

/**
 * Updates session metadata (notes, meeting_link, location, class_mode)
 */
export async function updateSessionDetails(
  sessionId: string,
  details: {
    notes?: string | null
    location?: string | null
    meeting_link?: string | null
    class_mode?: ClassMode
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (details.notes !== undefined) updates.notes = details.notes
    if (details.location !== undefined) updates.location = details.location
    if (details.meeting_link !== undefined) updates.meeting_link = details.meeting_link
    if (details.class_mode !== undefined) updates.class_mode = details.class_mode

    const { error } = await supabase
      .from('class_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('tutor_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update session details' }
  }
}

/**
 * Creates an ad-hoc class session on any date
 */
export async function createAdhocSession(data: {
  batch_id: string
  session_date: string
  start_time: string
  end_time: string
  class_mode?: ClassMode
  location?: string | null
  notes?: string | null
}): Promise<{ success: boolean; data?: ClassSession; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    // Check if session exists on this date for the batch
    const { data: existing } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('batch_id', data.batch_id)
      .eq('session_date', data.session_date)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'A class session is already scheduled for this batch on that date.' }
    }

    const newSession: ClassSessionInsert = {
      tutor_id: user.id,
      batch_id: data.batch_id,
      session_date: data.session_date,
      start_time: data.start_time,
      end_time: data.end_time,
      class_mode: data.class_mode || 'offline',
      location: data.location || null,
      notes: data.notes || null,
      status: 'scheduled',
      is_overridden: true,
    }

    const { data: created, error } = await supabase
      .from('class_sessions')
      .insert(newSession)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: created }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create session' }
  }
}
