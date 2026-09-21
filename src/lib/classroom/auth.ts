import { createClient } from '@/lib/supabase/server'
import type { ClassSessionWithBatch, Batch } from '@/types'
import type { ClassroomRole } from './types'

export interface SessionAuthResult {
  authorized: boolean
  role?: ClassroomRole
  studentId?: string
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

    // 2. Cancelled session guard
    if (session.status === 'cancelled') {
      return {
        authorized: false,
        session,
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

    // 5. Parent authorization check (Participant)
    // Check if user is an authorized parent with a linked student in this batch
    const { data: parentRecords } = await supabase
      .from('parents')
      .select('id, full_name, portal_enabled')
      .eq('user_id', user.id)
      .eq('portal_enabled', true)

    if (parentRecords && parentRecords.length > 0) {
      const parentIds = parentRecords.map((p) => p.id)
      // Find if parent has an enrolled student in this batch
      const { data: linkedEnrollment } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          parent_id,
          students:student_id (
            id,
            full_name,
            batch_students (
              batch_id,
              status
            )
          )
        `)
        .in('parent_id', parentIds)

      interface LinkedData {
        student_id: string
        parent_id: string
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
          studentId: matchingChild.students.id,
          user: {
            id: user.id,
            name: matchingChild.students.full_name,
            email: user.email,
          },
          session,
        }
      }
    }

    // 6. Student authorization check (Participant)
    // Check if user is an active student connected to this tutor
    const { data: studentConnections } = await supabase
      .from('student_tutor_connections')
      .select('id, student_user_id, tutor_id, student_record_id, status')
      .eq('student_user_id', user.id)
      .eq('tutor_id', session.tutor_id)
      .eq('status', 'active')

    if (studentConnections && studentConnections.length > 0) {
      return {
        authorized: true,
        role: 'participant',
        studentId: studentConnections[0].student_record_id || undefined,
        user: {
          id: user.id,
          name: userName,
          email: user.email,
        },
        session,
      }
    }

    // Check if student is directly enrolled in this session's batch by email
    if (user.email) {
      const { data: enrolledStudents } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          batch_students!inner (batch_id, status)
        `)
        .ilike('email', user.email)
        .eq('batch_students.batch_id', session.batch_id)
        .eq('batch_students.status', 'active')

      if (enrolledStudents && enrolledStudents.length > 0) {
        return {
          authorized: true,
          role: 'participant',
          studentId: enrolledStudents[0].id,
          user: {
            id: user.id,
            name: enrolledStudents[0].full_name || userName,
            email: user.email,
          },
          session,
        }
      }
    }

    // 7. Access denied (Not owner and not enrolled)
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

    const { data: parents } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .eq('portal_enabled', true)

    if (!parents || parents.length === 0) return false

    const parentIds = parents.map((p) => p.id)
    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id, batch_students!inner(batch_id, status)')
      .in('parent_id', parentIds)
      .eq('batch_students.batch_id', session.batch_id)
      .eq('batch_students.status', 'active')

    return Boolean(links && links.length > 0)
  } catch {
    return false
  }
}
