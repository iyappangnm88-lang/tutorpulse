import { createClient } from '@/lib/supabase/server'
import type { Attendance } from '@/types'

export async function getBatchAttendanceForDate(
  batchId: string,
  date: string
): Promise<{ data: Attendance[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('batch_id', batchId)
      .eq('attendance_date', date)

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    return { data: (data as Attendance[]) || [], error: null }
  } catch {
    return { data: [], error: 'Failed to load attendance records.' }
  }
}

export async function getSessionAttendance(
  sessionId: string,
  batchId: string,
  date: string
): Promise<{ data: Attendance[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: bySession, error: sessionErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId)

    if (!sessionErr && bySession && bySession.length > 0) {
      return { data: bySession as Attendance[], error: null }
    }

    return getBatchAttendanceForDate(batchId, date)
  } catch {
    return { data: [], error: 'Failed to load session attendance.' }
  }
}
