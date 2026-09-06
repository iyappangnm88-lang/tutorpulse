import { createClient } from '@/lib/supabase/server'
import type { ClassSessionWithBatch, Batch } from '@/types'
import type { ClassroomRole } from './types'

export interface SessionAuthResult {
  authorized: boolean
  role?: ClassroomRole
  user?: {
    id: string
    name: string
    email?: string | null
  }
  session?: ClassSessionWithBatch
  error?: string
}

/**
 * Validates whether the currently authenticated user is authorized to enter a class session.
 * Protects against IDOR:
 * - A tutor can only access sessions they own.
 * - A parent/student can only access sessions for batches they are actively enrolled in.
 * - Rejects unauthenticated callers, invalid session IDs, and offline/cancelled classes.
 */
export async function verifySessionAccess(sessionId: string): Promise<SessionAuthResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { authorized: false, error: 'Authentication required to enter classroom.' }
    }

    // 1. Fetch session and its batch
    const { data: rawSession, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*, batch:batches(*)')
      .eq('id', sessionId)
      .maybeSingle()

    if (sessionError || !rawSession) {
      return { authorized: false, error: 'Classroom session not found.' }
    }

    const session: ClassSessionWithBatch = {
      ...rawSession,
      batch: rawSession.batch as Batch,
    }

    // 2. Offline class guard
    if (session.class_mode === 'offline') {
      return {
        authorized: false,
        error: 'This session is configured as an offline in-person class.',
      }
    }

    // 3. Cancelled session guard
    if (session.status === 'cancelled') {
      return {
        authorized: false,
        error: 'This class session has been cancelled.',
      }
    }

    const userName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Participant'

    // 4. Tutor authorization check (Host)
    if (session.tutor_id === user.id) {
      return {
        authorized: true,
        role: 'host',
        user: {
          id: user.id,
          name: `${userName} (Tutor)`,
          email: user.email,
        },
        session,
      }
    }

    // 5. Parent / Student authorization check (Participant)
    // Check if user is an authorized parent with a linked student in this batch
    const { data: parentRecord } = await supabase
      .from('parents')
      .select('id, full_name, portal_enabled')
      .eq('user_id', user.id)
      .eq('portal_enabled', true)
      .maybeSingle()

    if (parentRecord) {
      // Find if parent has an enrolled student in this batch
      const { data: linkedEnrollment } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          students:student_id (
            id,
            full_name,
            batch_students (
              batch_id,
              status
            )
          )
        `)
        .eq('parent_id', parentRecord.id)

      interface LinkedData {
        student_id: string
        students: {
          id: string
          full_name: string
          batch_students: Array<{ batch_id: string; status: string }>
        }
      }

      const links = (linkedEnrollment as unknown as LinkedData[]) || []
      const matchingChild = links.find((l) =>
        l.students?.batch_students?.some(
          (bs) => bs.batch_id === session.batch_id && bs.status === 'active'
        )
      )

      if (matchingChild) {
        return {
          authorized: true,
          role: 'participant',
          user: {
            id: user.id,
            name: matchingChild.students.full_name,
            email: user.email,
          },
          session,
        }
      }
    }

    // 6. Access denied (Not owner and not enrolled)
    return {
      authorized: false,
      error: 'You are not enrolled in or authorized for this class session.',
    }
  } catch (err: any) {
    return {
      authorized: false,
      error: err.message || 'An unexpected authorization error occurred.',
    }
  }
}

/**
 * Reusable helper: Can a tutor access this session?
 */
export async function canTutorAccessSession(userId: string, sessionId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('tutor_id', userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

/**
 * Reusable helper: Can a parent/student access this session?
 */
export async function canParentAccessSession(userId: string, sessionId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: session } = await supabase
      .from('class_sessions')
      .select('batch_id')
      .eq('id', sessionId)
      .maybeSingle()

    if (!session) return false

    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .eq('portal_enabled', true)
      .maybeSingle()

    if (!parent) return false

    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id, batch_students!inner(batch_id, status)')
      .eq('parent_id', parent.id)
      .eq('batch_students.batch_id', session.batch_id)
      .eq('batch_students.status', 'active')

    return Boolean(links && links.length > 0)
  } catch {
    return false
  }
}
