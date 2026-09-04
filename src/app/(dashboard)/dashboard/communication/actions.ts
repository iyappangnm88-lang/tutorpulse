'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Creates an announcement targeted to All Parents, a Batch, or an Individual Student
 */
export async function createAnnouncementAction(input: {
  title: string
  message: string
  target_type: 'all' | 'batch' | 'student'
  batch_id?: string | null
  student_id?: string | null
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const title = input.title?.trim()
    const message = input.message?.trim()

    if (!title) return { success: false, error: 'Title is required.' }
    if (!message) return { success: false, error: 'Message is required.' }

    // Validation & ownership checks
    let batchId: string | null = null
    let studentId: string | null = null

    if (input.target_type === 'batch') {
      if (!input.batch_id) return { success: false, error: 'Please select a batch.' }
      const { data: batch } = await supabase
        .from('batches')
        .select('id')
        .eq('id', input.batch_id)
        .eq('tutor_id', user.id)
        .maybeSingle()
      if (!batch) return { success: false, error: 'Invalid batch selected.' }
      batchId = batch.id
    } else if (input.target_type === 'student') {
      if (!input.student_id) return { success: false, error: 'Please select a student.' }
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', input.student_id)
        .eq('tutor_id', user.id)
        .maybeSingle()
      if (!student) return { success: false, error: 'Invalid student selected.' }
      studentId = student.id
    }

    const { error: insertError } = await supabase.from('announcements').insert({
      tutor_id: user.id,
      target_type: input.target_type,
      batch_id: batchId,
      student_id: studentId,
      title,
      message,
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath('/dashboard/communication')
    revalidatePath('/dashboard')
    revalidatePath('/parent')
    revalidatePath('/parent/announcements')
    return { success: true }
  } catch (err: unknown) {
    console.error('createAnnouncementAction exception:', err)
    return { success: false, error: 'Failed to create announcement.' }
  }
}

/**
 * Deletes an announcement
 */
export async function deleteAnnouncementAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('tutor_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/communication')
    revalidatePath('/dashboard')
    revalidatePath('/parent/announcements')
    return { success: true }
  } catch (err: unknown) {
    console.error('deleteAnnouncementAction exception:', err)
    return { success: false, error: 'Failed to delete announcement.' }
  }
}

/**
 * Marks a single notification as read
 */
export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/communication')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    console.error('markNotificationReadAction exception:', err)
    return { success: false, error: 'Failed to update notification.' }
  }
}

/**
 * Marks all notifications of the user as read
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/communication')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    console.error('markAllNotificationsReadAction exception:', err)
    return { success: false, error: 'Failed to mark all as read.' }
  }
}
