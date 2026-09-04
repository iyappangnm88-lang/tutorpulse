'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Homework, HomeworkStudentStatus } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createHomeworkAction(input: {
  batch_id: string
  title: string
  description?: string | null
  instructions?: string | null
  assigned_date: string
  due_date?: string | null
  status?: 'Draft' | 'Assigned'
}): Promise<ActionResult<Homework>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.batch_id) {
      return { success: false, error: 'Please select a batch.' }
    }

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Homework title is required.' }
    }

    if (!input.assigned_date) {
      return { success: false, error: 'Assigned date is required.' }
    }

    if (input.due_date && input.due_date < input.assigned_date) {
      return { success: false, error: 'Due date cannot be earlier than assigned date.' }
    }

    // Verify batch belongs to tutor
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, name')
      .eq('id', input.batch_id)
      .eq('tutor_id', user.id)
      .single()

    if (batchError || !batch) {
      return { success: false, error: 'Batch not found or unauthorized.' }
    }

    // 1. Insert homework record
    const { data: homework, error: homeworkError } = await supabase
      .from('homework')
      .insert({
        tutor_id: user.id,
        batch_id: input.batch_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        instructions: input.instructions?.trim() || null,
        assigned_date: input.assigned_date,
        due_date: input.due_date || null,
        status: input.status || 'Assigned',
      })
      .select()
      .single()

    if (homeworkError || !homework) {
      console.error('createHomeworkAction insert error:', homeworkError)
      return { success: false, error: homeworkError?.message || 'Failed to create homework.' }
    }

    // 2. Fetch all active students currently in this batch
    const { data: enrolledStudents, error: enrolledError } = await supabase
      .from('batch_students')
      .select('student_id')
      .eq('batch_id', input.batch_id)
      .eq('status', 'active')

    if (!enrolledError && enrolledStudents && enrolledStudents.length > 0) {
      const studentRecords = enrolledStudents.map((item) => ({
        tutor_id: user.id,
        homework_id: homework.id,
        student_id: item.student_id,
        status: 'Pending' as const,
      }))

      const { error: batchInsertError } = await supabase
        .from('homework_students')
        .insert(studentRecords)

      if (batchInsertError) {
        console.error('Failed to auto-assign students to homework:', batchInsertError)
      }
    }

    revalidatePath('/dashboard/homework')
    revalidatePath(`/dashboard/batches/${input.batch_id}`)
    return { success: true, data: homework as Homework }
  } catch (err: unknown) {
    console.error('createHomeworkAction exception:', err)
    return { success: false, error: 'Failed to create homework assignment.' }
  }
}

export async function updateHomeworkAction(
  id: string,
  input: {
    batch_id: string
    title: string
    description?: string | null
    instructions?: string | null
    assigned_date: string
    due_date?: string | null
  }
): Promise<ActionResult<Homework>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (input.due_date && input.due_date < input.assigned_date) {
      return { success: false, error: 'Due date cannot be earlier than assigned date.' }
    }

    const { data, error } = await supabase
      .from('homework')
      .update({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        instructions: input.instructions?.trim() || null,
        assigned_date: input.assigned_date,
        due_date: input.due_date || null,
      })
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('updateHomeworkAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/homework')
    revalidatePath(`/dashboard/homework/${id}`)
    revalidatePath(`/dashboard/batches/${input.batch_id}`)
    return { success: true, data: data as Homework }
  } catch (err: unknown) {
    console.error('updateHomeworkAction exception:', err)
    return { success: false, error: 'Failed to update homework.' }
  }
}

export async function deleteHomeworkAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { error } = await supabase
      .from('homework')
      .delete()
      .eq('id', id)
      .eq('tutor_id', user.id)

    if (error) {
      console.error('deleteHomeworkAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/homework')
    return { success: true }
  } catch (err: unknown) {
    console.error('deleteHomeworkAction exception:', err)
    return { success: false, error: 'Failed to delete homework.' }
  }
}

export async function updateStudentHomeworkStatusAction(
  trackingId: string,
  status: HomeworkStudentStatus,
  notes?: string | null
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const completedAt = status === 'Completed' ? new Date().toISOString() : null

    const updatePayload: {
      status: HomeworkStudentStatus
      completed_at: string | null
      notes?: string | null
    } = {
      status,
      completed_at: completedAt,
    }

    if (notes !== undefined) {
      updatePayload.notes = notes
    }

    const { data, error } = await supabase
      .from('homework_students')
      .update(updatePayload)
      .eq('id', trackingId)
      .eq('tutor_id', user.id)
      .select('homework_id, student_id')
      .single()

    if (error || !data) {
      console.error('updateStudentHomeworkStatusAction error:', error)
      return { success: false, error: error?.message || 'Could not update student status.' }
    }

    revalidatePath('/dashboard/homework')
    revalidatePath(`/dashboard/homework/${data.homework_id}`)
    revalidatePath(`/dashboard/students/${data.student_id}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('updateStudentHomeworkStatusAction exception:', err)
    return { success: false, error: 'Failed to update student status.' }
  }
}

export async function bulkUpdateHomeworkStatusAction(
  homeworkId: string,
  targetStatus: 'Completed' | 'Pending'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const completedAt = targetStatus === 'Completed' ? new Date().toISOString() : null

    const { error } = await supabase
      .from('homework_students')
      .update({
        status: targetStatus,
        completed_at: completedAt,
      })
      .eq('homework_id', homeworkId)
      .eq('tutor_id', user.id)

    if (error) {
      console.error('bulkUpdateHomeworkStatusAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/homework')
    revalidatePath(`/dashboard/homework/${homeworkId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('bulkUpdateHomeworkStatusAction exception:', err)
    return { success: false, error: 'Failed to update student statuses.' }
  }
}
