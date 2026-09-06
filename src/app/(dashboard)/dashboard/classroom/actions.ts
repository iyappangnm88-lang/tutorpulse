'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifySessionAccess } from '@/lib/classroom/auth'
import { classroomService } from '@/lib/classroom/service'
import type { ClassSessionStatus } from '@/types'

/**
 * Server Action: Start a class session (Tutor only)
 * Sets status = 'in_progress' and records started_at timestamp.
 */
export async function startClassSessionAction(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify tutor ownership
    const { data: session, error: fetchError } = await supabase
      .from('class_sessions')
      .select('id, tutor_id, status, started_at')
      .eq('id', sessionId)
      .eq('tutor_id', user.id)
      .maybeSingle()

    if (fetchError || !session) {
      return { success: false, error: 'Session not found or permission denied' }
    }

    if (session.status === 'completed') {
      return { success: false, error: 'Cannot restart a completed class session.' }
    }

    const startedAt = session.started_at || new Date().toISOString()

    const { error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'in_progress',
        started_at: startedAt,
        meeting_provider: 'webrtc',
        meeting_room_id: `room-${sessionId}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('tutor_id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/dashboard/classroom/${sessionId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/parent')

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to start class session' }
  }
}

/**
 * Server Action: End a class session (Tutor only)
 * Requires intentional confirmation. Sets status = 'completed' and records ended_at timestamp.
 */
export async function endClassSessionAction(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify tutor ownership
    const { data: session, error: fetchError } = await supabase
      .from('class_sessions')
      .select('id, tutor_id, status, started_at, meeting_room_id')
      .eq('id', sessionId)
      .eq('tutor_id', user.id)
      .maybeSingle()

    if (fetchError || !session) {
      return { success: false, error: 'Session not found or permission denied' }
    }

    const now = new Date().toISOString()
    const startedAt = session.started_at || now

    const { error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'completed',
        started_at: startedAt,
        ended_at: now,
        updated_at: now,
      })
      .eq('id', sessionId)
      .eq('tutor_id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/dashboard/classroom/${sessionId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/parent')

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to end class session' }
  }
}

/**
 * Server Action: Record participant attendance log when joining a live session.
 */
export async function recordClassroomJoinAction(
  sessionId: string,
  userName: string,
  role: 'host' | 'participant' | 'spectator'
): Promise<{ success: boolean; participantLogId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('classroom_participants')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        user_name: userName,
        role,
        joined_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    if (error) {
      console.warn('Could not insert classroom_participants record:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, participantLogId: data?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Server Action: Record participant leave timestamp.
 */
export async function recordClassroomLeaveAction(
  participantLogId?: string
): Promise<{ success: boolean }> {
  if (!participantLogId) return { success: true }
  try {
    const supabase = await createClient()
    await supabase
      .from('classroom_participants')
      .update({
        left_at: new Date().toISOString(),
      })
      .eq('id', participantLogId)
    return { success: true }
  } catch {
    return { success: false }
  }
}

/**
 * Server Action: Verifies session authorization, returns session status and role details.
 * Protects against IDOR and checks role separation.
 */
export async function getClassroomTokenAction(sessionId: string): Promise<{
  success: boolean
  providerConfigured: boolean
  providerName?: string
  role?: 'host' | 'participant' | 'spectator'
  token?: string
  roomUrl?: string
  isCompleted?: boolean
  sessionStatus?: ClassSessionStatus
  error?: string
}> {
  try {
    const authResult = await verifySessionAccess(sessionId)

    if (!authResult.authorized || !authResult.session || !authResult.user || !authResult.role) {
      return {
        success: false,
        providerConfigured: false,
        error: authResult.error || 'Access denied.',
      }
    }

    const session = authResult.session

    if (session.status === 'completed') {
      return {
        success: false,
        providerConfigured: true,
        isCompleted: true,
        sessionStatus: 'completed',
        error: 'This class session has already ended.',
      }
    }

    const providerConfigured = classroomService.isConfigured()

    // Generate room token
    const tokenResult = await classroomService.generateToken(
      session,
      {
        id: authResult.user.id,
        name: authResult.user.name,
        email: authResult.user.email,
        role: authResult.role,
      },
      authResult.role
    )

    return {
      success: true,
      providerConfigured,
      providerName: classroomService.getProviderName(),
      role: authResult.role,
      token: tokenResult.token,
      roomUrl: tokenResult.roomUrl,
      sessionStatus: session.status,
    }
  } catch (err: any) {
    return {
      success: false,
      providerConfigured: false,
      error: err.message || 'Classroom initialization failed.',
    }
  }
}
