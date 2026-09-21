'use server'

import { createClient } from '@/lib/supabase/server'
import { verifySessionAccess } from '@/lib/classroom/auth'
import type { ClassroomPoll, ClassroomChatMessage } from '@/lib/classroom/types'
import type { ClassroomMessageRow, ClassroomPollRow } from '@/types/database'

export interface InteractionActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ==============================================================================
// 1. CLASSROOM CHAT ACTIONS
// ==============================================================================

/**
 * Sends a message in the active live classroom session.
 * Server securely derives sender_user_id, sender_role, and sender_name from authenticated session.
 */
export async function sendClassroomMessageAction(
  sessionId: string,
  text: string
): Promise<InteractionActionResult<ClassroomChatMessage>> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: authResult.error || 'Unauthorized to participate in this classroom.' }
    }

    const { session, role, user } = authResult

    // Session lifecycle guard
    if (session.status !== 'in_progress') {
      return { success: false, error: 'Chat is only available while the class session is in progress.' }
    }

    const trimmed = text.trim()
    if (!trimmed) {
      return { success: false, error: 'Message cannot be empty.' }
    }
    if (trimmed.length > 500) {
      return { success: false, error: 'Message cannot exceed 500 characters.' }
    }

    const supabase = await createClient()

    const senderRole = role === 'host' ? 'tutor' : 'student'
    const { data, error } = await supabase
      .from('classroom_messages')
      .insert({
        workspace_id: session.workspace_id || session.batch?.workspace_id,
        class_session_id: session.id,
        sender_user_id: user.id,
        sender_role: senderRole,
        sender_name: user.name,
        message: trimmed,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const row = data as ClassroomMessageRow
    const chatMessage: ClassroomChatMessage = {
      id: row.id,
      senderId: row.sender_user_id,
      senderName: row.sender_name,
      senderRole: row.sender_role === 'tutor' ? 'host' : 'participant',
      text: row.message,
      timestamp: row.created_at,
    }

    return { success: true, data: chatMessage }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send message.' }
  }
}

/**
 * Loads recent messages for the classroom session.
 */
export async function getClassroomMessagesAction(
  sessionId: string
): Promise<InteractionActionResult<ClassroomChatMessage[]>> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session) {
      return { success: false, error: authResult.error || 'Unauthorized.' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('classroom_messages')
      .select('*')
      .eq('class_session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      return { success: false, error: error.message }
    }

    const messages: ClassroomChatMessage[] = (data || []).map((row: ClassroomMessageRow) => ({
      id: row.id,
      senderId: row.sender_user_id,
      senderName: row.sender_name,
      senderRole: row.sender_role === 'tutor' ? 'host' : 'participant',
      text: row.message,
      timestamp: row.created_at,
    }))

    return { success: true, data: messages }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load messages.' }
  }
}

/**
 * Deletes a classroom message. Tutor can moderate any message; senders can delete their own.
 */
export async function deleteClassroomMessageAction(
  sessionId: string,
  messageId: string
): Promise<InteractionActionResult> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: authResult.error || 'Unauthorized.' }
    }

    const { session, role, user } = authResult
    const supabase = await createClient()

    // Query message to verify ownership
    const { data: msg } = await supabase
      .from('classroom_messages')
      .select('id, sender_user_id')
      .eq('id', messageId)
      .eq('class_session_id', sessionId)
      .maybeSingle()

    if (!msg) {
      return { success: false, error: 'Message not found.' }
    }

    const isTutor = role === 'host' && session.tutor_id === user.id
    const isSender = msg.sender_user_id === user.id

    if (!isTutor && !isSender) {
      return { success: false, error: 'Permission denied: Cannot delete this message.' }
    }

    const { error } = await supabase
      .from('classroom_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete message.' }
  }
}

// ==============================================================================
// 2. LIVE POLLS & QUICK QUESTIONS ACTIONS
// ==============================================================================

/**
 * Creates a new classroom poll (Tutor host only).
 */
export async function createClassroomPollAction(
  sessionId: string,
  question: string,
  options: string[],
  autoStart: boolean = true
): Promise<InteractionActionResult<ClassroomPoll>> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: authResult.error || 'Unauthorized.' }
    }

    const { session, role, user } = authResult

    if (role !== 'host' || session.tutor_id !== user.id) {
      return { success: false, error: 'Only the tutor host can create classroom polls.' }
    }

    if (session.status === 'completed') {
      return { success: false, error: 'Cannot create polls in a completed session.' }
    }

    const cleanQuestion = question.trim()
    if (!cleanQuestion) {
      return { success: false, error: 'Poll question cannot be empty.' }
    }
    if (cleanQuestion.length > 300) {
      return { success: false, error: 'Question cannot exceed 300 characters.' }
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean)
    if (cleanOptions.length < 2) {
      return { success: false, error: 'Poll must have at least 2 options.' }
    }
    if (cleanOptions.length > 6) {
      return { success: false, error: 'Poll cannot have more than 6 options.' }
    }

    const status = autoStart ? 'active' : 'draft'
    const now = new Date().toISOString()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('classroom_polls')
      .insert({
        workspace_id: session.workspace_id || session.batch?.workspace_id,
        class_session_id: session.id,
        tutor_id: user.id,
        question: cleanQuestion,
        options: cleanOptions,
        status,
        results_revealed: false,
        started_at: autoStart ? now : null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const row = data as ClassroomPollRow
    const poll: ClassroomPoll = {
      id: row.id,
      workspace_id: row.workspace_id,
      class_session_id: row.class_session_id,
      tutor_id: row.tutor_id,
      question: row.question,
      options: row.options as string[],
      status: row.status as 'draft' | 'active' | 'closed',
      results_revealed: row.results_revealed,
      created_at: row.created_at,
      started_at: row.started_at,
      closed_at: row.closed_at,
      total_votes: 0,
      vote_counts: new Array(cleanOptions.length).fill(0),
    }

    return { success: true, data: poll }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create poll.' }
  }
}

/**
 * Starts a drafted poll (Tutor host only).
 */
export async function startClassroomPollAction(
  sessionId: string,
  pollId: string
): Promise<InteractionActionResult> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    if (authResult.role !== 'host') {
      return { success: false, error: 'Only the tutor can start polls.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('classroom_polls')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', pollId)
      .eq('class_session_id', sessionId)
      .eq('tutor_id', authResult.user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to start poll.' }
  }
}

/**
 * Closes an active poll (Tutor host only).
 */
export async function closeClassroomPollAction(
  sessionId: string,
  pollId: string
): Promise<InteractionActionResult> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    if (authResult.role !== 'host') {
      return { success: false, error: 'Only the tutor can close polls.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('classroom_polls')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', pollId)
      .eq('class_session_id', sessionId)
      .eq('tutor_id', authResult.user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to close poll.' }
  }
}

/**
 * Toggles revealing aggregate poll results to students (Tutor host only).
 */
export async function revealClassroomPollResultsAction(
  sessionId: string,
  pollId: string,
  reveal: boolean
): Promise<InteractionActionResult> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    if (authResult.role !== 'host') {
      return { success: false, error: 'Only the tutor can reveal results.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('classroom_polls')
      .update({ results_revealed: reveal })
      .eq('id', pollId)
      .eq('class_session_id', sessionId)
      .eq('tutor_id', authResult.user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update results visibility.' }
  }
}

/**
 * Submits a student's answer to an active poll.
 * Strictly enforces single vote per student via database unique constraint.
 */
export async function submitClassroomPollResponseAction(
  sessionId: string,
  pollId: string,
  optionIndex: number
): Promise<InteractionActionResult> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: authResult.error || 'Unauthorized.' }
    }

    const { session, user, studentId } = authResult

    if (session.status !== 'in_progress') {
      return { success: false, error: 'Poll voting is only available during an active class session.' }
    }

    const supabase = await createClient()

    // Verify poll is active
    const { data: poll, error: pollError } = await supabase
      .from('classroom_polls')
      .select('id, status, options')
      .eq('id', pollId)
      .eq('class_session_id', sessionId)
      .maybeSingle()

    if (pollError || !poll) {
      return { success: false, error: 'Poll not found.' }
    }

    if (poll.status !== 'active') {
      return { success: false, error: 'This poll is no longer accepting responses.' }
    }

    const options = (poll.options as string[]) || []
    if (optionIndex < 0 || optionIndex >= options.length) {
      return { success: false, error: 'Invalid option selected.' }
    }

    const { error: insertError } = await supabase
      .from('classroom_poll_responses')
      .insert({
        poll_id: pollId,
        class_session_id: sessionId,
        user_id: user.id,
        student_id: studentId || null,
        option_index: optionIndex,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: false, error: 'You have already submitted an answer to this poll.' }
      }
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit poll answer.' }
  }
}

/**
 * Retrieves all polls and computed aggregate results for a class session.
 */
export async function getClassroomPollsAction(
  sessionId: string
): Promise<InteractionActionResult<ClassroomPoll[]>> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: authResult.error || 'Unauthorized.' }
    }

    const { role, user } = authResult
    const supabase = await createClient()

    const { data: rawPolls, error } = await supabase
      .from('classroom_polls')
      .select('*')
      .eq('class_session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const pollsList = (rawPolls || []) as ClassroomPollRow[]
    if (pollsList.length === 0) {
      return { success: true, data: [] }
    }

    const pollIds = pollsList.map((p) => p.id)

    // Query user's own responses
    const { data: myResponses } = await supabase
      .from('classroom_poll_responses')
      .select('poll_id, option_index')
      .eq('user_id', user.id)
      .in('poll_id', pollIds)

    const myResponseMap: Record<string, number> = {}
    ;(myResponses || []).forEach((r) => {
      myResponseMap[r.poll_id] = r.option_index
    })

    // If tutor, or poll results are revealed: compute aggregates
    const isTutor = role === 'host'
    const aggregateMap: Record<string, { total: number; counts: number[] }> = {}

    if (isTutor) {
      const { data: allResponses } = await supabase
        .from('classroom_poll_responses')
        .select('poll_id, option_index')
        .in('poll_id', pollIds)

      pollsList.forEach((p) => {
        const opts = (p.options as string[]) || []
        aggregateMap[p.id] = { total: 0, counts: new Array(opts.length).fill(0) }
      })

      ;(allResponses || []).forEach((r) => {
        const aggr = aggregateMap[r.poll_id]
        if (aggr && r.option_index >= 0 && r.option_index < aggr.counts.length) {
          aggr.counts[r.option_index]++
          aggr.total++
        }
      })
    } else {
      // For participants: only query aggregate if results_revealed is true
      const revealedPollIds = pollsList.filter((p) => p.results_revealed).map((p) => p.id)
      if (revealedPollIds.length > 0) {
        const { data: revealedResponses } = await supabase
          .from('classroom_poll_responses')
          .select('poll_id, option_index')
          .in('poll_id', revealedPollIds)

        pollsList.forEach((p) => {
          if (p.results_revealed) {
            const opts = (p.options as string[]) || []
            aggregateMap[p.id] = { total: 0, counts: new Array(opts.length).fill(0) }
          }
        })

        ;(revealedResponses || []).forEach((r) => {
          const aggr = aggregateMap[r.poll_id]
          if (aggr && r.option_index >= 0 && r.option_index < aggr.counts.length) {
            aggr.counts[r.option_index]++
            aggr.total++
          }
        })
      }
    }

    const enrichedPolls: ClassroomPoll[] = pollsList.map((p) => {
      const opts = (p.options as string[]) || []
      const aggr = aggregateMap[p.id]
      const showResults = isTutor || p.results_revealed

      return {
        id: p.id,
        workspace_id: p.workspace_id,
        class_session_id: p.class_session_id,
        tutor_id: p.tutor_id,
        question: p.question,
        options: opts,
        status: p.status as 'draft' | 'active' | 'closed',
        results_revealed: p.results_revealed,
        created_at: p.created_at,
        started_at: p.started_at,
        closed_at: p.closed_at,
        total_votes: showResults ? aggr?.total || 0 : undefined,
        vote_counts: showResults ? aggr?.counts || new Array(opts.length).fill(0) : undefined,
        user_voted_option: myResponseMap[p.id] !== undefined ? myResponseMap[p.id] : null,
      }
    })

    return { success: true, data: enrichedPolls }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch polls.' }
  }
}
