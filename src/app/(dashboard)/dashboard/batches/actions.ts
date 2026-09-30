'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/workspace'
import { validateBatchSchedule } from '@/lib/scheduling'
import { injectBatchPricingMetadata } from '@/lib/batches'
import type { Batch, BatchInsert, BatchUpdate, Student } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createBatchAction(
  input: Omit<BatchInsert, 'tutor_id'> & { student_ids?: string[] }
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

    const activeWs = await getActiveWorkspace()
    const targetWorkspace = activeWs.activeWorkspace
    const workspaceType = activeWs.workspaceType

    // Enforce class mode and location according to workspace type
    const enforcedMode = workspaceType === 'offline' ? 'offline' : 'online'
    const targetLocation = workspaceType === 'offline' ? input.location : null

    // Server-side validation of recurring batch schedule
    const scheduleValidation = validateBatchSchedule({
      working_days: input.working_days,
      start_time: input.start_time,
      end_time: input.end_time,
      class_mode: enforcedMode,
      location: targetLocation,
    })

    if (!scheduleValidation.isValid) {
      const firstError = Object.values(scheduleValidation.errors)[0]
      return { success: false, error: firstError || 'Invalid schedule.' }
    }

    const newBatch: BatchInsert = {
      tutor_id: user.id,
      workspace_id: input.workspace_id || targetWorkspace?.id || null,
      name: input.name.trim(),
      subject: input.subject?.trim() || null,
      class_name: input.class_name?.trim() || null,
      working_days: scheduleValidation.normalizedData.working_days,
      start_time: scheduleValidation.normalizedData.start_time,
      end_time: scheduleValidation.normalizedData.end_time,
      class_mode: enforcedMode,
      location: scheduleValidation.normalizedData.location,
      schedule: scheduleValidation.normalizedData.schedule,
      classes_per_week: input.classes_per_week !== undefined && input.classes_per_week !== null
        ? Number(input.classes_per_week)
        : (scheduleValidation.normalizedData.working_days?.length || 3),
      description: input.description?.trim() || null,
      is_public: input.is_public ?? false,
      public_description: input.public_description?.trim() || null,
      pricing_rate: input.pricing_rate != null ? Number(input.pricing_rate) : null,
      pricing_unit: input.pricing_unit || 'per_month',
      pricing_currency: input.pricing_currency || 'INR',
      pricing_description: input.pricing_description?.trim() || null,
      max_students: input.max_students != null ? Number(input.max_students) : null,
      status: input.status || 'active',
    }

    let insertRes = await supabase
      .from('batches')
      .insert(newBatch)
      .select()
      .single()

    // Schema fallback resilience: if migration 027 not yet applied on remote, retry without new columns
    if (insertRes.error && (insertRes.error.message.includes('pricing_rate') || insertRes.error.message.includes('column'))) {
      const fallbackBatch = { ...newBatch }
      delete fallbackBatch.pricing_rate
      delete fallbackBatch.pricing_unit
      delete fallbackBatch.pricing_currency
      delete fallbackBatch.pricing_description
      delete fallbackBatch.max_students

      // Persist pricing metadata inside batch description
      if (input.pricing_rate != null || input.max_students != null) {
        fallbackBatch.description = injectBatchPricingMetadata(fallbackBatch.description, {
          rate: input.pricing_rate != null ? Number(input.pricing_rate) : null,
          unit: input.pricing_unit || 'per_month',
          currency: input.pricing_currency || 'INR',
          description: input.pricing_description || null,
          max_students: input.max_students != null ? Number(input.max_students) : null,
        })
      }

      insertRes = await supabase
        .from('batches')
        .insert(fallbackBatch)
        .select()
        .single()
    }

    const { data, error } = insertRes

    if (error) {
      console.error('createBatchAction error:', error)
      return { success: false, error: error.message }
    }

    // Sync default pricing to tutor's profile so discovery has transparent rates
    if (input.pricing_rate != null && Number(input.pricing_rate) > 0) {
      await supabase
        .from('profiles')
        .update({
          pricing_rate: Number(input.pricing_rate),
          pricing_unit: input.pricing_unit || 'per_month',
          pricing_currency: input.pricing_currency || 'INR',
          pricing_description: input.pricing_description?.trim() || null,
        })
        .eq('id', user.id)
    }

    // Attach students if provided during creation
    if (input.student_ids && input.student_ids.length > 0) {
      const studentRows = input.student_ids.map((student_id) => ({
        batch_id: data.id,
        student_id,
        status: 'active' as const,
      }))
      const { error: memberError } = await supabase
        .from('batch_students')
        .upsert(studentRows, { onConflict: 'batch_id,student_id' })
      if (memberError) {
        console.error('Error adding students during batch creation:', memberError)
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/marketplace')
    revalidatePath('/dashboard/batches')
    revalidatePath('/dashboard/attendance')
    revalidatePath('/tutors')
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

    const { data: existingBatch } = await supabase
      .from('batches')
      .select('id, workspace_id, class_mode')
      .eq('id', id)
      .eq('tutor_id', user.id)
      .single()

    if (!existingBatch) {
      return { success: false, error: 'Batch not found or unauthorized.' }
    }

    // Changing teaching mode between offline and online is strictly prohibited
    if (input.class_mode !== undefined && input.class_mode !== existingBatch.class_mode) {
      return {
        success: false,
        error: 'Changing teaching mode between Offline and Online is not permitted. Batches belong to a specific workspace.',
      }
    }

    const updateData: BatchUpdate = {
      name: input.name?.trim(),
      subject: input.subject?.trim() || null,
      class_name: input.class_name?.trim() || null,
      description: input.description?.trim() || null,
      is_public: input.is_public !== undefined ? input.is_public : undefined,
      public_description: input.public_description !== undefined ? (input.public_description?.trim() || null) : undefined,
      classes_per_week: input.classes_per_week !== undefined ? (input.classes_per_week !== null ? Number(input.classes_per_week) : null) : undefined,
      pricing_rate: input.pricing_rate !== undefined ? (input.pricing_rate !== null ? Number(input.pricing_rate) : null) : undefined,
      pricing_unit: input.pricing_unit !== undefined ? (input.pricing_unit || 'per_month') : undefined,
      pricing_currency: input.pricing_currency !== undefined ? (input.pricing_currency || 'INR') : undefined,
      pricing_description: input.pricing_description !== undefined ? (input.pricing_description?.trim() || null) : undefined,
      max_students: input.max_students !== undefined ? (input.max_students !== null ? Number(input.max_students) : null) : undefined,
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
      const targetMode = existingBatch.class_mode // Mode cannot be mutated
      const targetLocation = targetMode === 'offline' ? (input.location ?? null) : null

      const scheduleValidation = validateBatchSchedule({
        working_days: input.working_days,
        start_time: input.start_time,
        end_time: input.end_time,
        class_mode: targetMode,
        location: targetLocation,
      })

      if (!scheduleValidation.isValid) {
        const firstError = Object.values(scheduleValidation.errors)[0]
        return { success: false, error: firstError || 'Invalid schedule.' }
      }

      updateData.working_days = scheduleValidation.normalizedData.working_days
      updateData.start_time = scheduleValidation.normalizedData.start_time
      updateData.end_time = scheduleValidation.normalizedData.end_time
      updateData.class_mode = targetMode
      updateData.location = scheduleValidation.normalizedData.location
      updateData.schedule = scheduleValidation.normalizedData.schedule
    }

    let updateRes = await supabase
      .from('batches')
      .update(updateData)
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    // Fallback resilience if migration 027 not yet applied on remote
    if (updateRes.error && (updateRes.error.message.includes('pricing_rate') || updateRes.error.message.includes('column'))) {
      const fallbackData = { ...updateData }
      delete fallbackData.pricing_rate
      delete fallbackData.pricing_unit
      delete fallbackData.pricing_currency
      delete fallbackData.pricing_description
      delete fallbackData.max_students

      let baseDesc = fallbackData.description
      if (baseDesc === undefined) {
        const { data: currentB } = await supabase.from('batches').select('description').eq('id', id).single()
        baseDesc = currentB?.description || null
      }

      fallbackData.description = injectBatchPricingMetadata(baseDesc, {
        rate: input.pricing_rate !== undefined ? (input.pricing_rate != null ? Number(input.pricing_rate) : null) : null,
        unit: input.pricing_unit || 'per_month',
        currency: input.pricing_currency || 'INR',
        description: input.pricing_description || null,
        max_students: input.max_students !== undefined ? (input.max_students != null ? Number(input.max_students) : null) : null,
      })

      updateRes = await supabase
        .from('batches')
        .update(fallbackData)
        .eq('id', id)
        .eq('tutor_id', user.id)
        .select()
        .single()
    }

    const { data, error } = updateRes

    if (error) {
      console.error('updateBatchAction error:', error)
      return { success: false, error: error.message }
    }

    // Sync default pricing to tutor's profile if updated
    if (input.pricing_rate !== undefined && input.pricing_rate != null && Number(input.pricing_rate) > 0) {
      await supabase
        .from('profiles')
        .update({
          pricing_rate: Number(input.pricing_rate),
          pricing_unit: input.pricing_unit || 'per_month',
          pricing_currency: input.pricing_currency || 'INR',
          pricing_description: input.pricing_description?.trim() || null,
        })
        .eq('id', user.id)
    }

    // If class_mode was updated, synchronize future unstarted scheduled sessions
    // Historical sessions (past date or completed/in-progress) remain 100% untouched
    if (updateData.class_mode !== undefined) {
      const todayStr = new Date().toISOString().split('T')[0]
      const sessionUpdates: Record<string, any> = {
        class_mode: updateData.class_mode,
        updated_at: new Date().toISOString(),
      }
      if (updateData.class_mode === 'online') {
        sessionUpdates.location = null
      } else if (updateData.location !== undefined) {
        sessionUpdates.location = updateData.location
      }

      await supabase
        .from('class_sessions')
        .update(sessionUpdates)
        .eq('batch_id', id)
        .eq('tutor_id', user.id)
        .eq('status', 'scheduled')
        .eq('is_overridden', false)
        .gte('session_date', todayStr)
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/marketplace')
    revalidatePath('/dashboard/batches')
    revalidatePath(`/dashboard/batches/${id}`)
    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/classroom')
    revalidatePath('/tutors')
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

    // Verify batch ownership and workspace_id
    const { data: batch } = await supabase
      .from('batches')
      .select('id, workspace_id')
      .eq('id', batchId)
      .eq('tutor_id', user.id)
      .single()

    if (!batch) {
      return { success: false, error: 'Batch not found or unauthorized.' }
    }

    // Verify all students belong to the same workspace as the batch
    if (batch.workspace_id) {
      const { data: students } = await supabase
        .from('students')
        .select('id, workspace_id')
        .in('id', studentIds)

      const invalidStudent = (students || []).find((s) => s.workspace_id !== batch.workspace_id)
      if (invalidStudent) {
        return {
          success: false,
          error: 'Cross-workspace enrollment is forbidden. Students must belong to the same teaching workspace as the batch.',
        }
      }
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


export async function createAndEnrollStudentAction(
  batchId: string,
  studentInput: {
    full_name: string
    phone?: string | null
    email?: string | null
    class_name?: string | null
    school_name?: string | null
    notes?: string | null
  }
): Promise<ActionResult<Student>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!studentInput.full_name || studentInput.full_name.trim().length === 0) {
      return { success: false, error: 'Student full name is required.' }
    }

    // Verify batch ownership
    const { data: batch, error: batchErr } = await supabase
      .from('batches')
      .select('id, workspace_id')
      .eq('id', batchId)
      .eq('tutor_id', user.id)
      .single()

    if (batchErr || !batch) {
      return { success: false, error: 'Batch not found or unauthorized.' }
    }

    // 1. Create student record
    const newStudent = {
      tutor_id: user.id,
      workspace_id: batch.workspace_id,
      full_name: studentInput.full_name.trim(),
      phone: studentInput.phone?.trim() || null,
      email: studentInput.email?.trim() || null,
      class_name: studentInput.class_name?.trim() || null,
      school_name: studentInput.school_name?.trim() || null,
      notes: studentInput.notes?.trim() || null,
      status: 'active' as const,
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert(newStudent)
      .select()
      .single()

    if (studentError || !student) {
      console.error('Error creating student:', studentError)
      return { success: false, error: studentError?.message || 'Failed to create student.' }
    }

    // 2. Associate student with batch
    const { error: enrollError } = await supabase
      .from('batch_students')
      .insert({
        batch_id: batchId,
        student_id: student.id,
        status: 'active',
      })

    if (enrollError) {
      console.error('Error enrolling student to batch:', enrollError)
      return { success: false, error: enrollError.message }
    }

    revalidatePath('/dashboard/batches')
    revalidatePath(`/dashboard/batches/${batchId}`)
    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/attendance')

    return { success: true, data: student as Student }
  } catch (err: unknown) {
    console.error('createAndEnrollStudentAction exception:', err)
    return { success: false, error: 'Failed to create and enroll student.' }
  }
}

export async function toggleBatchMarketplaceAction(
  batchId: string,
  isPublic: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized. Please sign in.' }

    const { error } = await supabase
      .from('batches')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .eq('tutor_id', user.id)

    if (error) {
      console.error('toggleBatchMarketplaceAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/marketplace')
    revalidatePath('/dashboard/batches')
    return { success: true }
  } catch (err: unknown) {
    console.error('toggleBatchMarketplaceAction exception:', err)
    return { success: false, error: 'Failed to update batch visibility.' }
  }
}

export async function toggleTutorMarketplaceVisibilityAction(
  isPublic: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized. Please sign in.' }

    const { error } = await supabase
      .from('profiles')
      .update({ is_public_marketplace: isPublic, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      console.error('toggleTutorMarketplaceVisibilityAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/marketplace')
    revalidatePath('/dashboard')
    revalidatePath('/tutors')
    return { success: true }
  } catch (err: unknown) {
    console.error('toggleTutorMarketplaceVisibilityAction exception:', err)
    return { success: false, error: 'Failed to update marketplace profile visibility.' }
  }
}

export async function updateTutorMarketplacePricingAction(input: {
  pricing_rate: number | null
  pricing_unit?: string
  pricing_currency?: string
  pricing_description?: string | null
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized. Please sign in.' }

    const updates: Record<string, any> = {
      pricing_rate: input.pricing_rate !== null && !isNaN(Number(input.pricing_rate)) ? Number(input.pricing_rate) : null,
      pricing_unit: input.pricing_unit || 'per_month',
      pricing_currency: input.pricing_currency || 'INR',
      pricing_description: input.pricing_description?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('updateTutorMarketplacePricingAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/marketplace')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/batches')
    revalidatePath('/tutors')
    return { success: true }
  } catch (err: unknown) {
    console.error('updateTutorMarketplacePricingAction exception:', err)
    return { success: false, error: 'Failed to save pricing.' }
  }
}

