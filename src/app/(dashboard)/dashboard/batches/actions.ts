'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateBatchSchedule } from '@/lib/scheduling'
import type { Batch, BatchInsert, BatchUpdate } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createBatchAction(
  input: Omit<BatchInsert, 'tutor_id'>
): Promise<ActionResult<Batch>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: 'Batch name is required.' }
    }

    // Server-side validation of recurring batch schedule
    const scheduleValidation = validateBatchSchedule({
      working_days: input.working_days,
      start_time: input.start_time,
      end_time: input.end_time,
      class_mode: input.class_mode,
      location: input.location,
    })

    if (!scheduleValidation.isValid) {
      const firstError = Object.values(scheduleValidation.errors)[0]
      return { success: false, error: firstError || 'Invalid schedule.' }
    }

    const newBatch: BatchInsert = {
      tutor_id: user.id,
      name: input.name.trim(),
      subject: input.subject?.trim() || null,
      class_name: input.class_name?.trim() || null,
      working_days: scheduleValidation.normalizedData.working_days,
      start_time: scheduleValidation.normalizedData.start_time,
      end_time: scheduleValidation.normalizedData.end_time,
      class_mode: scheduleValidation.normalizedData.class_mode,
      location: scheduleValidation.normalizedData.location,
      schedule: scheduleValidation.normalizedData.schedule,
      description: input.description?.trim() || null,
      status: input.status || 'active',
    }

    const { data, error } = await supabase
      .from('batches')
      .insert(newBatch)
      .select()
      .single()

    if (error) {
      console.error('createBatchAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    revalidatePath('/dashboard/attendance')
    return { success: true, data: data as Batch }
  } catch (err: unknown) {
    console.error('createBatchAction exception:', err)
    return { success: false, error: 'Failed to create batch.' }
  }
}

export async function updateBatchAction(
  id: string,
  input: Omit<BatchUpdate, 'id' | 'tutor_id'>
): Promise<ActionResult<Batch>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      return { success: false, error: 'Batch name cannot be empty.' }
    }

    const updateData: BatchUpdate = {
      name: input.name?.trim(),
      subject: input.subject?.trim() || null,
      class_name: input.class_name?.trim() || null,
      description: input.description?.trim() || null,
      status: input.status,
    }

    // If schedule fields are provided, validate and normalize them
    if (
      input.working_days !== undefined ||
      input.start_time !== undefined ||
      input.end_time !== undefined ||
      input.class_mode !== undefined ||
      input.location !== undefined
    ) {
      const scheduleValidation = validateBatchSchedule({
        working_days: input.working_days,
        start_time: input.start_time,
        end_time: input.end_time,
        class_mode: input.class_mode,
        location: input.location,
      })

      if (!scheduleValidation.isValid) {
        const firstError = Object.values(scheduleValidation.errors)[0]
        return { success: false, error: firstError || 'Invalid schedule.' }
      }

      updateData.working_days = scheduleValidation.normalizedData.working_days
      updateData.start_time = scheduleValidation.normalizedData.start_time
      updateData.end_time = scheduleValidation.normalizedData.end_time
      updateData.class_mode = scheduleValidation.normalizedData.class_mode
      updateData.location = scheduleValidation.normalizedData.location
      updateData.schedule = scheduleValidation.normalizedData.schedule
    }

    const { data, error } = await supabase
      .from('batches')
      .update(updateData)
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('updateBatchAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    revalidatePath(`/dashboard/batches/${id}`)
    revalidatePath('/dashboard/attendance')
    return { success: true, data: data as Batch }
  } catch (err: unknown) {
    console.error('updateBatchAction exception:', err)
    return { success: false, error: 'Failed to update batch.' }
  }
}

export async function archiveBatchAction(id: string): Promise<ActionResult<Batch>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { data, error } = await supabase
      .from('batches')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('archiveBatchAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/batches')
    revalidatePath(`/dashboard/batches/${id}`)
    revalidatePath('/dashboard/attendance')
    return { success: true, data: data as Batch }
  } catch (err: unknown) {
    console.error('archiveBatchAction exception:', err)
    return { success: false, error: 'Failed to archive batch.' }
  }
}

export async function addStudentsToBatchAction(
  batchId: string,
  studentIds: string[]
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!studentIds || studentIds.length === 0) {
      return { success: false, error: 'No students selected.' }
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

    const rows = studentIds.map((student_id) => ({
      batch_id: batchId,
      student_id,
      status: 'active' as const,
    }))

    const { error } = await supabase
      .from('batch_students')
      .upsert(rows, { onConflict: 'batch_id,student_id' })

    if (error) {
      console.error('addStudentsToBatchAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/batches')
    revalidatePath(`/dashboard/batches/${batchId}`)
    revalidatePath('/dashboard/attendance')
    return { success: true, data: studentIds.length }
  } catch (err: unknown) {
    console.error('addStudentsToBatchAction exception:', err)
    return { success: false, error: 'Failed to add students to batch.' }
  }
}

export async function removeStudentFromBatchAction(
  batchId: string,
  studentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { error } = await supabase
      .from('batch_students')
      .delete()
      .eq('batch_id', batchId)
      .eq('student_id', studentId)

    if (error) {
      console.error('removeStudentFromBatchAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/batches')
    revalidatePath(`/dashboard/batches/${batchId}`)
    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (err: unknown) {
    console.error('removeStudentFromBatchAction exception:', err)
    return { success: false, error: 'Failed to remove student from batch.' }
  }
}
