'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Parent, ParentInsert, ParentUpdate } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createParentAction(
  input: Omit<ParentInsert, 'tutor_id'>
): Promise<ActionResult<Parent>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.full_name || input.full_name.trim().length === 0) {
      return { success: false, error: 'Parent full name is required.' }
    }

    const newParent: ParentInsert = {
      tutor_id: user.id,
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      alternate_phone: input.alternate_phone?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
    }

    const { data, error } = await supabase
      .from('parents')
      .insert(newParent)
      .select()
      .single()

    if (error) {
      console.error('createParentAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/parents')
    return { success: true, data: data as Parent }
  } catch (err: unknown) {
    console.error('createParentAction exception:', err)
    return { success: false, error: 'Failed to create parent contact.' }
  }
}

export async function updateParentAction(
  id: string,
  input: Omit<ParentUpdate, 'id' | 'tutor_id'>
): Promise<ActionResult<Parent>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (input.full_name !== undefined && input.full_name.trim().length === 0) {
      return { success: false, error: 'Parent full name cannot be empty.' }
    }

    const updateData: ParentUpdate = {
      full_name: input.full_name?.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      alternate_phone: input.alternate_phone?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
    }

    const { data, error } = await supabase
      .from('parents')
      .update(updateData)
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('updateParentAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/parents')
    revalidatePath(`/dashboard/parents/${id}`)
    return { success: true, data: data as Parent }
  } catch (err: unknown) {
    console.error('updateParentAction exception:', err)
    return { success: false, error: 'Failed to update parent contact.' }
  }
}

export async function deleteParentAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { error } = await supabase
      .from('parents')
      .delete()
      .eq('id', id)
      .eq('tutor_id', user.id)

    if (error) {
      console.error('deleteParentAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/parents')
    return { success: true }
  } catch (err: unknown) {
    console.error('deleteParentAction exception:', err)
    return { success: false, error: 'Failed to delete parent contact.' }
  }
}

export async function linkStudentToParentAction(
  parentId: string,
  studentId: string,
  relationship: string,
  isPrimary: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    // Verify parent ownership
    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('id', parentId)
      .eq('tutor_id', user.id)
      .single()

    if (!parent) {
      return { success: false, error: 'Parent not found or unauthorized.' }
    }

    // Verify student ownership
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('tutor_id', user.id)
      .single()

    if (!student) {
      return { success: false, error: 'Student not found or unauthorized.' }
    }

    const { error } = await supabase
      .from('parent_students')
      .upsert({
        parent_id: parentId,
        student_id: studentId,
        relationship: relationship || 'Parent',
        is_primary: isPrimary,
      }, { onConflict: 'parent_id,student_id' })

    if (error) {
      console.error('linkStudentToParentAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/parents')
    revalidatePath(`/dashboard/parents/${parentId}`)
    revalidatePath(`/dashboard/students/${studentId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('linkStudentToParentAction exception:', err)
    return { success: false, error: 'Failed to link student.' }
  }
}

export async function unlinkStudentFromParentAction(
  parentId: string,
  studentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { error } = await supabase
      .from('parent_students')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId)

    if (error) {
      console.error('unlinkStudentFromParentAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/parents')
    revalidatePath(`/dashboard/parents/${parentId}`)
    revalidatePath(`/dashboard/students/${studentId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('unlinkStudentFromParentAction exception:', err)
    return { success: false, error: 'Failed to unlink student.' }
  }
}
