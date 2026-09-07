import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/workspace'
import type { Student } from '@/types'

export async function getStudents(workspaceId?: string): Promise<{ data: Student[]; error: string | null }> {
  try {
    const supabase = await createClient()

    let wsId = workspaceId
    if (!wsId) {
      const activeWs = await getActiveWorkspace()
      wsId = activeWs.activeWorkspace?.id
    }

    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (wsId) {
      query = query.eq('workspace_id', wsId)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    return { data: (data as Student[]) || [], error: null }
  } catch {
    return { data: [], error: null }
  }
}

export async function getStudentById(id: string, workspaceId?: string): Promise<{ data: Student | null; error: string | null }> {
  try {
    const supabase = await createClient()

    let wsId = workspaceId
    if (!wsId) {
      const activeWs = await getActiveWorkspace()
      wsId = activeWs.activeWorkspace?.id
    }

    let query = supabase
      .from('students')
      .select('*')
      .eq('id', id)

    if (wsId) {
      query = query.eq('workspace_id', wsId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: null, error: null }
      }
      return { data: null, error: error.message }
    }

    return { data: (data as Student) || null, error: null }
  } catch {
    return { data: null, error: 'Failed to load student details' }
  }
}
