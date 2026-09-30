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

export async function getMonthlyAttendancePct(workspaceId?: string): Promise<number | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]

    let query = supabase
      .from('attendance')
      .select('status')
      .eq('tutor_id', user.id)
      .gte('attendance_date', startOfMonth)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) return null

    const presentCount = data.filter((a) => a.status === 'present' || a.status === 'late').length
    return Math.round((presentCount / data.length) * 100)
  } catch {
    return null
  }
}

