'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AttendanceInsert, AttendanceStatus } from '@/types'

export interface AttendanceEntryInput {
  student_id: string
  status: AttendanceStatus
  note?: string | null
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function saveAttendanceAction(
  batchId: string,
  attendanceDate: string,
  entries: AttendanceEntryInput[]
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!batchId || !attendanceDate || entries.length === 0) {
      return { success: false, error: 'Invalid attendance submission data.' }
    }

    // Verify batch ownership
    const { data: batch } = await supabase
      .from('batches')
      .select('id')
      .eq('id', batchId)
      .eq('tutor_id', user.id)
      .single()

    if (!batch) {
      return { success: false, error: 'Batch not found or unauthorized.' }
    }

    const rows: AttendanceInsert[] = entries.map((entry) => ({
      tutor_id: user.id,
      batch_id: batchId,
      student_id: entry.student_id,
      attendance_date: attendanceDate,
      status: entry.status,
      note: entry.note?.trim() || null,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'batch_id,student_id,attendance_date' })

    if (error) {
      console.error('saveAttendanceAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    revalidatePath(`/dashboard/batches/${batchId}`)
    return { success: true, data: rows.length }
  } catch (err: unknown) {
    console.error('saveAttendanceAction exception:', err)
    return { success: false, error: 'Failed to save attendance.' }
  }
}
