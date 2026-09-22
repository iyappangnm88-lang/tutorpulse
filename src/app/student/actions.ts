'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Previews tutor and workspace information for an invite code before joining.
 */
export async function previewInviteAction(inviteCode: string): Promise<
  ActionResponse<{
    tutorName: string
    workspaceName: string
    workspaceType: string
    primarySubjects?: string[]
  }>
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const cleanCode = inviteCode.trim().toUpperCase()
    if (!cleanCode) {
      return { success: false, error: 'Please enter an invite code.' }
    }

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name, type, tutor_id, invite_code')
      .ilike('invite_code', cleanCode)
      .maybeSingle()

    if (wsError || !workspace) {
      return { success: false, error: 'Invalid invite code. Please check with your tutor.' }
    }

    if (workspace.tutor_id === user.id) {
      return { success: false, error: 'You cannot connect to your own workspace.' }
    }

    // Fetch tutor profile
    const { data: tutorProfile } = await supabase
      .from('profiles')
      .select('full_name, primary_subjects')
      .eq('id', workspace.tutor_id)
      .maybeSingle()

    return {
      success: true,
      data: {
        tutorName: tutorProfile?.full_name || 'Tutor',
        workspaceName: workspace.name,
        workspaceType: workspace.type,
        primarySubjects: tutorProfile?.primary_subjects || [],
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to preview invite.'
    return { success: false, error: message }
  }
}

/**
 * Joins a tutor using their workspace invitation code.
 */
export async function joinTutorByInviteAction(
  inviteCode: string
): Promise<ActionResponse<{ tutorId: string; workspaceName: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const cleanCode = inviteCode.trim().toUpperCase()
    if (!cleanCode) {
      return { success: false, error: 'Please enter an invite code.' }
    }

    // 1. Call atomic join_tutor_by_invite_code RPC
    const { data, error } = await supabase.rpc('join_tutor_by_invite_code', {
      p_invite_code: cleanCode,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = data as any
    if (!result?.success) {
      return { success: false, error: result?.error || 'Failed to join tutor.' }
    }

    // 2. Ensure student record in tutor's workspace exists and is linked
    try {
      const tutorId = result.tutor_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      const studentName = profile?.full_name || user.user_metadata?.name || 'Student'
      const studentEmail = user.email || ''

      // Check if student record exists for this tutor
      let { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('tutor_id', tutorId)
        .ilike('email', studentEmail)
        .maybeSingle()

      if (!existingStudent && studentEmail) {
        // Create student record so tutor sees learner in their roster
        const { data: newStudent } = await supabase
          .from('students')
          .insert({
            tutor_id: tutorId,
            full_name: studentName,
            email: studentEmail,
            status: 'active',
          })
          .select('id')
          .maybeSingle()

        existingStudent = newStudent
      }

      if (existingStudent?.id) {
        // Link student_record_id on connection
        await supabase
          .from('student_tutor_connections')
          .update({ student_record_id: existingStudent.id })
          .eq('student_user_id', user.id)
          .eq('tutor_id', tutorId)
      }
    } catch {
      // Non-fatal: connection is already active
    }

    revalidatePath('/student')
    revalidatePath('/student/tutors')
    revalidatePath('/student/classes')
    revalidatePath('/student/homework')

    return {
      success: true,
      data: {
        tutorId: result.tutor_id,
        workspaceName: result.workspace_name,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return { success: false, error: message }
  }
}

/**
 * Safely leaves a tutor connection by marking status as inactive (non-destructive).
 */
export async function leaveTutorAction(connectionId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    // Verify ownership
    const { data: conn, error: findError } = await supabase
      .from('student_tutor_connections')
      .select('id, student_user_id')
      .eq('id', connectionId)
      .eq('student_user_id', user.id)
      .maybeSingle()

    if (findError || !conn) {
      return { success: false, error: 'Connection not found.' }
    }

    // Update to inactive (preserves historical tests, homework, and attendance)
    const { error: updateError } = await supabase
      .from('student_tutor_connections')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/student')
    revalidatePath('/student/tutors')
    revalidatePath('/student/classes')

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to leave tutor.'
    return { success: false, error: message }
  }
}

/**
 * Toggles homework completion status for the student.
 */
export async function toggleHomeworkStatusAction(
  homeworkId: string,
  completed: boolean
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    // 1. Get homework record to identify tutor_id
    const { data: hw, error: hwError } = await supabase
      .from('homework')
      .select('id, tutor_id')
      .eq('id', homeworkId)
      .maybeSingle()

    if (hwError || !hw) {
      return { success: false, error: 'Homework record not found.' }
    }

    // 2. Resolve student record id for this tutor
    let studentRecordId: string | null = null
    const { data: conn } = await supabase
      .from('student_tutor_connections')
      .select('student_record_id')
      .eq('student_user_id', user.id)
      .eq('tutor_id', hw.tutor_id)
      .maybeSingle()

    if (conn?.student_record_id) {
      studentRecordId = conn.student_record_id
    } else if (user.email) {
      const { data: s } = await supabase
        .from('students')
        .select('id')
        .eq('tutor_id', hw.tutor_id)
        .ilike('email', user.email)
        .maybeSingle()
      studentRecordId = s?.id || null
    }

    if (!studentRecordId) {
      return { success: false, error: 'Student record not linked. Please re-join the tutor.' }
    }

    const newStatus = completed ? 'Completed' : 'Pending'
    const completedAt = completed ? new Date().toISOString() : null

    // Check existing homework_students row
    const { data: existingRecord } = await supabase
      .from('homework_students')
      .select('id')
      .eq('homework_id', homeworkId)
      .eq('student_id', studentRecordId)
      .maybeSingle()

    if (existingRecord) {
      await supabase
        .from('homework_students')
        .update({
          status: newStatus,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id)
    } else {
      await supabase.from('homework_students').insert({
        tutor_id: hw.tutor_id,
        homework_id: homeworkId,
        student_id: studentRecordId,
        status: newStatus,
        completed_at: completedAt,
      })
    }

    revalidatePath('/student')
    revalidatePath('/student/homework')
    revalidatePath('/student/progress')

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update homework status.'
    return { success: false, error: message }
  }
}

/**
 * Updates student personal profile information.
 */
export async function updateStudentProfileAction(data: {
  fullName: string
  gradeLevel?: string
  schoolName?: string
  interests?: string[]
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const cleanName = data.fullName.trim()
    if (!cleanName) {
      return { success: false, error: 'Name cannot be empty.' }
    }

    // 1. Update profiles table
    await supabase
      .from('profiles')
      .update({
        full_name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // 2. Update student_profiles table
    const { error: studentProfError } = await supabase
      .from('student_profiles')
      .upsert({
        id: user.id,
        full_name: cleanName,
        grade_level: data.gradeLevel?.trim() || null,
        school_name: data.schoolName?.trim() || null,
        interests: data.interests || [],
        updated_at: new Date().toISOString(),
      })

    if (studentProfError) {
      return { success: false, error: studentProfError.message }
    }

    revalidatePath('/student')
    revalidatePath('/student/settings')

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.'
    return { success: false, error: message }
  }
}
