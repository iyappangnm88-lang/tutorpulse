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

/**
 * Starts a new persistent focus session in database.
 */
export async function startFocusSessionAction(
  plannedDurationSec: number,
  subject: string = 'General Focus',
  groupId?: string | null
): Promise<ActionResponse<{ sessionId: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        student_user_id: user.id,
        group_id: groupId || null,
        subject: subject.trim() || 'General Focus',
        planned_duration_sec: plannedDurationSec,
        actual_duration_sec: 0,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to start focus session in database.' }
    }

    if (groupId) {
      await supabase.from('study_group_live_focus').upsert(
        {
          group_id: groupId,
          user_id: user.id,
          session_id: data.id,
          subject: subject.trim() || 'General Focus',
          started_at: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
          is_paused: false,
        },
        { onConflict: 'group_id,user_id' }
      )
    }

    return { success: true, data: { sessionId: data.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error starting focus session.'
    return { success: false, error: message }
  }
}

/**
 * Pauses an active focus session in database.
 */
export async function pauseFocusSessionAction(
  sessionId: string,
  actualDurationSec: number,
  groupId?: string | null
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Authentication required.' }

    await supabase
      .from('focus_sessions')
      .update({
        status: 'paused',
        actual_duration_sec: actualDurationSec,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('student_user_id', user.id)

    if (groupId) {
      await supabase
        .from('study_group_live_focus')
        .update({ is_paused: true, last_heartbeat: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', user.id)
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error pausing focus session.'
    return { success: false, error: message }
  }
}

/**
 * Resumes a paused focus session in database.
 */
export async function resumeFocusSessionAction(
  sessionId: string,
  groupId?: string | null
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Authentication required.' }

    await supabase
      .from('focus_sessions')
      .update({
        status: 'running',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('student_user_id', user.id)

    if (groupId) {
      await supabase
        .from('study_group_live_focus')
        .update({ is_paused: false, last_heartbeat: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', user.id)
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error resuming focus session.'
    return { success: false, error: message }
  }
}

/**
 * Completes a focus session, calculates rewards, updates student XP/Coins/Streaks idempotently.
 */
export async function completeFocusSessionAction(params: {
  sessionId?: string | null
  groupId?: string | null
  subject: string
  plannedDurationSec: number
  actualDurationSec: number
}): Promise<ActionResponse<{ xpEarned: number; coinsEarned: number; actualDurationSec: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Authentication required.' }

    const actualSec = Math.max(0, params.actualDurationSec)
    const minutes = Math.floor(actualSec / 60)

    const xpEarned = Math.max(10, minutes + 10)
    const coinsEarned = actualSec >= 1500 ? 5 : (actualSec >= 600 ? 2 : 1)

    let alreadyAwarded = false
    if (params.sessionId) {
      const { data: existing } = await supabase
        .from('focus_sessions')
        .select('id, status, xp_awarded')
        .eq('id', params.sessionId)
        .eq('student_user_id', user.id)
        .maybeSingle()

      if (existing && existing.status === 'completed' && existing.xp_awarded > 0) {
        alreadyAwarded = true
      }
    }

    if (!alreadyAwarded) {
      if (params.sessionId) {
        await supabase
          .from('focus_sessions')
          .update({
            group_id: params.groupId || null,
            status: 'completed',
            actual_duration_sec: actualSec,
            ended_at: new Date().toISOString(),
            xp_awarded: xpEarned,
            coins_awarded: coinsEarned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.sessionId)
          .eq('student_user_id', user.id)
      } else {
        await supabase
          .from('focus_sessions')
          .insert({
            student_user_id: user.id,
            group_id: params.groupId || null,
            subject: params.subject.trim() || 'General Focus',
            planned_duration_sec: params.plannedDurationSec,
            actual_duration_sec: actualSec,
            status: 'completed',
            ended_at: new Date().toISOString(),
            xp_awarded: xpEarned,
            coins_awarded: coinsEarned,
          })
      }

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('xp, gold_coins_balance, streak_count, longest_streak, last_active_date')
        .eq('id', user.id)
        .maybeSingle()

      const currentXp = profile?.xp || 0
      const currentCoins = profile?.gold_coins_balance || 0
      const streakCount = profile?.streak_count || 0
      const longestStreak = profile?.longest_streak || 0
      const todayDateStr = new Date().toISOString().split('T')[0]
      const lastActive = profile?.last_active_date

      let newStreak = streakCount
      if (!lastActive) {
        newStreak = 1
      } else if (lastActive !== todayDateStr) {
        const lastDate = new Date(lastActive)
        const today = new Date(todayDateStr)
        const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          newStreak += 1
        } else if (diffDays > 1) {
          newStreak = 1
        }
      }

      await supabase
        .from('student_profiles')
        .update({
          xp: currentXp + xpEarned,
          gold_coins_balance: currentCoins + coinsEarned,
          streak_count: newStreak,
          longest_streak: Math.max(longestStreak, newStreak),
          last_active_date: todayDateStr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (coinsEarned > 0) {
        await supabase
          .from('gold_coin_transactions')
          .insert({
            student_user_id: user.id,
            amount: coinsEarned,
            transaction_type: 'LESSON_COMPLETE',
            source: 'milestone',
            description: 'Completed ' + minutes + 'm focus session in ' + (params.subject || 'General Focus'),
            metadata: {
              subject: params.subject,
              actualDurationSec: actualSec,
              plannedDurationSec: params.plannedDurationSec,
            },
          })
      }
    }

    if (params.groupId) {
      await supabase
        .from('study_group_live_focus')
        .delete()
        .eq('group_id', params.groupId)
        .eq('user_id', user.id)
    }

    revalidatePath('/student')
    revalidatePath('/student/progress')
    revalidatePath('/student/settings')
    if (params.groupId) {
      revalidatePath(`/student/study-groups/${params.groupId}`)
      revalidatePath('/student/study-groups')
    }

    return {
      success: true,
      data: {
        xpEarned,
        coinsEarned,
        actualDurationSec: actualSec,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error completing focus session.'
    return { success: false, error: message }
  }
}

/**
 * Ends a focus session early upon confirmation. Awards partial XP if focused for >= 5 minutes.
 */
export async function endFocusSessionAction(params: {
  sessionId?: string | null
  groupId?: string | null
  subject: string
  plannedDurationSec: number
  actualDurationSec: number
}): Promise<ActionResponse<{ xpEarned: number; actualDurationSec: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Authentication required.' }

    const actualSec = Math.max(0, params.actualDurationSec)
    const minutes = Math.floor(actualSec / 60)
    const partialXp = actualSec >= 300 ? minutes : 0

    if (params.sessionId) {
      await supabase
        .from('focus_sessions')
        .update({
          group_id: params.groupId || null,
          status: 'ended',
          actual_duration_sec: actualSec,
          ended_at: new Date().toISOString(),
          xp_awarded: partialXp,
          coins_awarded: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.sessionId)
        .eq('student_user_id', user.id)
    } else {
      await supabase
        .from('focus_sessions')
        .insert({
          student_user_id: user.id,
          group_id: params.groupId || null,
          subject: params.subject.trim() || 'General Focus',
          planned_duration_sec: params.plannedDurationSec,
          actual_duration_sec: actualSec,
          status: 'ended',
          ended_at: new Date().toISOString(),
          xp_awarded: partialXp,
          coins_awarded: 0,
        })
    }

    if (partialXp > 0) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('xp')
        .eq('id', user.id)
        .maybeSingle()

      const currentXp = profile?.xp || 0
      await supabase
        .from('student_profiles')
        .update({
          xp: currentXp + partialXp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    if (params.groupId) {
      await supabase
        .from('study_group_live_focus')
        .delete()
        .eq('group_id', params.groupId)
        .eq('user_id', user.id)
    }

    revalidatePath('/student')
    revalidatePath('/student/progress')
    if (params.groupId) {
      revalidatePath(`/student/study-groups/${params.groupId}`)
      revalidatePath('/student/study-groups')
    }

    return {
      success: true,
      data: {
        xpEarned: partialXp,
        actualDurationSec: actualSec,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error ending focus session.'
    return { success: false, error: message }
  }
}

/**
 * Action to upload a student profile picture from device gallery/file picker.
 * Validates file type, size, uploads to Supabase storage, and updates profiles & student_profiles.
 */
export async function uploadStudentAvatarAction(
  formData: FormData
): Promise<ActionResponse<{ avatarUrl: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' }
    }

    const file = formData.get('avatar') as File | null
    if (!file) {
      return { success: false, error: 'No image file provided.' }
    }

    // Validate size (max 3MB)
    const MAX_SIZE = 3 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Image file size must be less than 3MB.' }
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validMimes.includes(file.type.toLowerCase())) {
      return { success: false, error: 'Invalid image format. Supported: JPG, PNG, WEBP.' }
    }

    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `students/${fileName}`

    // Attempt upload to avatars bucket
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    let publicUrl = ''

    if (uploadError) {
      console.warn('Storage bucket upload failed, using optimized base64 fallback:', uploadError.message)
      const base64Data = Buffer.from(fileBuffer).toString('base64')
      publicUrl = `data:${file.type};base64,${base64Data}`
    } else {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    }

    // Update profiles table
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    // Update student_profiles table
    await supabase
      .from('student_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    revalidatePath('/student')
    revalidatePath('/student/profile')
    revalidatePath('/student/settings')
    revalidatePath('/student/study-groups')

    return { success: true, data: { avatarUrl: publicUrl } }
  } catch (err: unknown) {
    console.error('uploadStudentAvatarAction exception:', err)
    return { success: false, error: 'Failed to upload profile picture.' }
  }
}

/**
 * Updates student display name directly.
 */
export async function updateStudentDisplayNameAction(
  newName: string
): Promise<ActionResponse<{ fullName: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const cleanName = newName.trim()
    if (!cleanName) {
      return { success: false, error: 'Display name cannot be empty.' }
    }
    if (cleanName.length > 50) {
      return { success: false, error: 'Display name cannot exceed 50 characters.' }
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
    await supabase
      .from('student_profiles')
      .update({
        full_name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // 3. Update auth metadata
    try {
      await supabase.auth.updateUser({
        data: { full_name: cleanName },
      })
    } catch {
      // Non-critical
    }

    revalidatePath('/student')
    revalidatePath('/student/profile')
    revalidatePath('/student/settings')
    revalidatePath('/student/study-groups')

    return { success: true, data: { fullName: cleanName } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update name.'
    return { success: false, error: message }
  }
}