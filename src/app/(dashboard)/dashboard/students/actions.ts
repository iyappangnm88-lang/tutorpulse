'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Student, StudentInsert, StudentUpdate } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createStudentAction(
  input: Omit<StudentInsert, 'tutor_id'>
): Promise<ActionResult<Student>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.full_name || input.full_name.trim().length === 0) {
      return { success: false, error: 'Student full name is required.' }
    }

    const newStudent: StudentInsert = {
      ...input,
      tutor_id: user.id,
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      class_name: input.class_name?.trim() || null,
      school_name: input.school_name?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status || 'active',
      date_of_birth: input.date_of_birth || null,
      gender: input.gender || null,
    }

    const { data, error } = await supabase
      .from('students')
      .insert(newStudent)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/students')
    return { success: true, data: data as Student }
  } catch (err: unknown) {
    console.error('Unexpected error creating student:', err)
    return { success: false, error: 'Failed to create student. Please try again.' }
  }
}

export async function updateStudentAction(
  id: string,
  input: Omit<StudentUpdate, 'id' | 'tutor_id'>
): Promise<ActionResult<Student>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (input.full_name !== undefined && input.full_name.trim().length === 0) {
      return { success: false, error: 'Student full name cannot be empty.' }
    }

    const updateData: StudentUpdate = {
      ...input,
      full_name: input.full_name?.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      class_name: input.class_name?.trim() || null,
      school_name: input.school_name?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
    }

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating student:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/students')
    revalidatePath(`/dashboard/students/${id}`)
    return { success: true, data: data as Student }
  } catch (err: unknown) {
    console.error('Unexpected error updating student:', err)
    return { success: false, error: 'Failed to update student. Please try again.' }
  }
}

export async function archiveStudentAction(id: string): Promise<ActionResult<Student>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { data, error } = await supabase
      .from('students')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error archiving student:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/students')
    revalidatePath(`/dashboard/students/${id}`)
    return { success: true, data: data as Student }
  } catch (err: unknown) {
    console.error('Unexpected error archiving student:', err)
    return { success: false, error: 'Failed to archive student.' }
  }
}
